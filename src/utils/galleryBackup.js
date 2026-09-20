import JSZip from 'jszip'
import { appendGalleryImages, makeId, readGalleryImages, readMediaBlob } from './imageStorage.js'
import { writeMediaFile } from './mediaFileStore.js'

const MANIFEST_NAME = 'manifest.json'
const MEDIA_FOLDER = 'media'

export async function exportGalleryBackup() {
  const records = readGalleryImages()
  const zip = new JSZip()
  const mediaFolder = zip.folder(MEDIA_FOLDER)

  const manifestRecords = []
  for (const record of records) {
    const blob = await readMediaBlob(record)
    if (!blob) continue
    // 備份一律轉成獨立檔案存放，dataUrl 這種舊格式打包後就不用再相容。
    const extension = record.fileName ? record.fileName.split('.').pop() : record.mediaType === 'video' ? 'mp4' : 'webp'
    const fileName = record.fileName || `${record.id}.${extension}`
    mediaFolder.file(fileName, blob)
    manifestRecords.push({ ...record, fileName })
  }

  zip.file(
    MANIFEST_NAME,
    JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), records: manifestRecords }, null, 2)
  )

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `yozutime-gallery-backup-${new Date().toISOString().slice(0, 10)}.zip`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)

  return manifestRecords.length
}

export async function importGalleryBackup(file) {
  const zip = await JSZip.loadAsync(file)
  const manifestEntry = zip.file(MANIFEST_NAME)
  if (!manifestEntry) throw new Error('不是有效的備份檔（找不到 manifest.json）')

  const manifest = JSON.parse(await manifestEntry.async('string'))
  if (!Array.isArray(manifest.records)) throw new Error('備份檔內容格式錯誤')

  const existingIds = new Set(readGalleryImages().map((item) => item.id))
  const restored = []

  for (const record of manifest.records) {
    const entry = zip.file(`${MEDIA_FOLDER}/${record.fileName}`)
    if (!entry) continue
    const blob = await entry.async('blob')

    // 匯入的圖片 id／檔名跟目前已經有的撞到的話，換一組新的，避免互相覆蓋。
    let nextRecord = record
    if (existingIds.has(record.id)) {
      const newId = makeId()
      const extension = record.fileName.split('.').pop()
      nextRecord = { ...record, id: newId, fileName: `${newId}.${extension}` }
    }

    await writeMediaFile(nextRecord.fileName, blob)
    restored.push(nextRecord)
    existingIds.add(nextRecord.id)
  }

  appendGalleryImages(restored)
  return restored.length
}
