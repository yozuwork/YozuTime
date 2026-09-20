import { STORAGE_KEYS } from './storageKeys.js'
import { deleteMediaFile, readMediaFile, writeMediaFile } from './mediaFileStore.js'

// 圖庫的儲存層。中繼資料（誰是誰、尺寸、標記）存在 localStorage，體積很小、
// 一定放得下；實際的圖片／影片位元組交給 mediaFileStore（本機資料夾或 OPFS），
// 容量遠大於 localStorage 的 5MB 上限，才不會傳第二張就悄悄失敗。
// 舊資料如果還留著 dataUrl（升級前存的），readMediaBlob 會自動相容讀取，
// 不用特別搬家。

const MAX_IMAGE_SIZE = 20 * 1024 * 1024
const MAX_VIDEO_SIZE = 60 * 1024 * 1024
const SUPPORTED_VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v'])

export function makeId() {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getFileExtension(name) {
  const match = /\.([a-z0-9]+)$/i.exec(name || '')
  return match ? match[1].toLowerCase() : ''
}

function getMediaKind(file) {
  const extension = getFileExtension(file.name)
  if (file.type === 'image/gif' || extension === 'gif') return 'gif'
  if (file.type.startsWith('video/') || SUPPORTED_VIDEO_EXTENSIONS.has(extension)) return 'video'
  if (file.type.startsWith('image/')) return 'image'
  return null
}

export function validateGalleryFile(file) {
  const mediaType = getMediaKind(file)
  if (!mediaType) return { ok: false, error: '請選擇圖片或影片檔案' }
  const maxSize = mediaType === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
  if (file.size > maxSize) {
    return { ok: false, error: mediaType === 'video' ? '影片請小於 60 MB' : '圖片請小於 20 MB' }
  }
  return { ok: true, mediaType }
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function readGalleryImages() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.pomodoroGalleryImages)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

// 中繼資料不再包含圖片本身，體積很小，寫入失敗代表真的有問題（例如私密瀏覽
// 完全關閉了 localStorage），直接讓錯誤往上丟，讓呼叫端可以顯示訊息，
// 而不是像以前一樣悄悄吞掉、假裝成功。
function writeGalleryImages(list) {
  window.localStorage.setItem(STORAGE_KEYS.pomodoroGalleryImages, JSON.stringify(list))
}

// 相容舊資料：升級前上傳的圖片還留著 dataUrl，直接可以當 src 用；
// 新資料只存 fileName，要向 mediaFileStore 要實際的檔案內容。
export async function readMediaBlob(record) {
  if (!record) return null
  if (record.fileName) return readMediaFile(record.fileName)
  if (record.dataUrl) {
    try {
      const response = await fetch(record.dataUrl)
      return await response.blob()
    } catch {
      return null
    }
  }
  return null
}

// GIF／影片只需要拿到寬高做顯示用途，不能像靜態圖那樣畫進 canvas，否則動畫只會剩下第一格畫面。
function readMediaDimensions(file, mediaType) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const cleanup = () => URL.revokeObjectURL(objectUrl)
    if (mediaType === 'video') {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        resolve({ width: video.videoWidth, height: video.videoHeight })
        cleanup()
      }
      video.onerror = () => {
        resolve({ width: 0, height: 0 })
        cleanup()
      }
      video.src = objectUrl
    } else {
      const image = new Image()
      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight })
        cleanup()
      }
      image.onerror = () => {
        resolve({ width: 0, height: 0 })
        cleanup()
      }
      image.src = objectUrl
    }
  })
}

// 圖片只會顯示在縮圖大小的區域；先縮圖並轉成 WebP，避免佔用不必要的空間。
function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      try {
        const maxSide = 720
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl)
            if (!blob) {
              reject(new Error('圖片轉檔失敗'))
              return
            }
            resolve({ blob, width: canvas.width, height: canvas.height })
          },
          'image/webp',
          0.86
        )
      } catch (error) {
        URL.revokeObjectURL(objectUrl)
        reject(error)
      }
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('無法讀取圖片'))
    }
    image.src = objectUrl
  })
}

async function saveGalleryBlob(blob, { name, mediaType, width, height, extension }) {
  const id = makeId()
  const fileName = `${id}.${extension}`

  await writeMediaFile(fileName, blob)

  const record = {
    id,
    name,
    mediaType,
    width,
    height,
    size: blob.size,
    createdAt: new Date().toISOString(),
    isFavorite: false,
    isWorkImage: false,
    isBreakImage: false,
    isIdleImage: false,
    lastUsedAt: null,
    fileName
  }

  writeGalleryImages([record, ...readGalleryImages()])
  return record
}

export async function addGalleryImage(file) {
  const mediaType = getMediaKind(file) || 'image'

  if (mediaType === 'image') {
    const { blob, width, height } = await resizeImageFile(file)
    return saveGalleryBlob(blob, { name: file.name, mediaType, width, height, extension: 'webp' })
  }

  // GIF／影片保留原始檔案（不經過縮圖轉檔），才能維持動畫與影片內容。
  const { width, height } = await readMediaDimensions(file, mediaType)
  const extension = getFileExtension(file.name) || (mediaType === 'gif' ? 'gif' : 'mp4')
  return saveGalleryBlob(file, { name: file.name, mediaType, width, height, extension })
}

export function deleteGalleryImage(id) {
  const current = readGalleryImages()
  const target = current.find((item) => item.id === id)
  const next = current.filter((item) => item.id !== id)
  writeGalleryImages(next)
  if (target?.fileName) deleteMediaFile(target.fileName)
  return next
}

export function toggleFavorite(id) {
  const next = readGalleryImages().map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
  writeGalleryImages(next)
  return next
}

export function setWorkImage(id) {
  const now = new Date().toISOString()
  const next = readGalleryImages().map((item) => {
    if (item.id === id) return { ...item, isWorkImage: true, lastUsedAt: now }
    return item.isWorkImage ? { ...item, isWorkImage: false } : item
  })
  writeGalleryImages(next)
  return next
}

export function setBreakImage(id) {
  const now = new Date().toISOString()
  const next = readGalleryImages().map((item) => {
    if (item.id === id) return { ...item, isBreakImage: true, lastUsedAt: now }
    return item.isBreakImage ? { ...item, isBreakImage: false } : item
  })
  writeGalleryImages(next)
  return next
}

export function setIdleImage(id) {
  const now = new Date().toISOString()
  const next = readGalleryImages().map((item) => {
    if (item.id === id) return { ...item, isIdleImage: true, lastUsedAt: now }
    return item.isIdleImage ? { ...item, isIdleImage: false } : item
  })
  writeGalleryImages(next)
  return next
}

// 匯入備份用：把還原的紀錄直接寫回中繼資料（檔案本身要由呼叫端先寫進 mediaFileStore）。
export function appendGalleryImages(records) {
  writeGalleryImages([...records, ...readGalleryImages()])
  return readGalleryImages()
}
