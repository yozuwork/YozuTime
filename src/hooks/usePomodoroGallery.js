import { useEffect, useMemo, useState } from 'react'
import {
  addGalleryImage,
  deleteGalleryImage,
  readGalleryImages,
  setBreakImage,
  setIdleImage,
  setWorkImage,
  toggleFavorite,
  validateGalleryFile
} from '../utils/imageStorage.js'
import { uploadImageToCloud } from '../utils/cloudStorage.js'

const PAGE_SIZE = 24

export const GALLERY_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'recent', label: '最近使用' },
  { id: 'favorite', label: '我的最愛' },
  { id: 'work', label: '工作圖片' },
  { id: 'break', label: '休息圖片' },
  { id: 'idle', label: '待機圖片' }
]

function matchesCategory(image, category) {
  if (category === 'recent') return Boolean(image.lastUsedAt)
  if (category === 'favorite') return image.isFavorite
  if (category === 'work') return image.isWorkImage
  if (category === 'break') return image.isBreakImage
  if (category === 'idle') return image.isIdleImage
  return true
}

function sortForCategory(list, category) {
  if (category === 'recent') {
    return [...list].sort((a, b) => new Date(b.lastUsedAt || 0) - new Date(a.lastUsedAt || 0))
  }
  return [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}

function usePomodoroGallery() {
  const [images, setImages] = useState(readGalleryImages)
  const [selectedIds, setSelectedIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [previewId, setPreviewId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [cloudUploadingId, setCloudUploadingId] = useState(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, category])

  const filteredImages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const byCategory = images.filter((image) => matchesCategory(image, category))
    const byQuery = query ? byCategory.filter((image) => image.name?.toLowerCase().includes(query)) : byCategory
    return sortForCategory(byQuery, category)
  }, [images, category, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredImages.length / PAGE_SIZE))
  const pagedImages = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredImages.slice(start, start + PAGE_SIZE)
  }, [filteredImages, currentPage])

  const previewImage = previewId ? images.find((image) => image.id === previewId) || null : null

  function refresh(nextList) {
    setImages(nextList)
  }

  // 匯入備份這類「不是透過這個 hook 寫入」的異動，重新從儲存層讀一次讓畫面同步。
  function reloadImages() {
    setImages(readGalleryImages())
  }

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) {
      setError('請選擇圖片或影片檔案')
      return
    }

    setUploading(true)
    setError('')
    let hasError = false
    for (const file of files) {
      const validation = validateGalleryFile(file)
      if (!validation.ok) {
        hasError = true
        continue
      }
      try {
        await addGalleryImage(file)
        setImages(readGalleryImages())
      } catch {
        hasError = true
      }
    }
    if (hasError) setError('部分檔案上傳失敗，請確認格式與檔案大小')
    setUploading(false)
  }

  function toggleSelect(id) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function clearSelection() {
    setSelectedIds([])
  }

  function deleteImages(ids) {
    let nextList = images
    for (const id of ids) {
      nextList = deleteGalleryImage(id)
    }
    refresh(nextList)
    setSelectedIds((current) => current.filter((id) => !ids.includes(id)))
    if (previewId && ids.includes(previewId)) setPreviewId(null)
  }

  function handleToggleFavorite(id) {
    refresh(toggleFavorite(id))
  }

  function handleSetWorkImage(id) {
    refresh(setWorkImage(id))
  }

  function handleSetBreakImage(id) {
    refresh(setBreakImage(id))
  }

  function handleSetIdleImage(id) {
    refresh(setIdleImage(id))
  }

  // 本機新增（uploadFiles）永遠是預設路徑；雲端上傳是使用者對單張圖片另外觸發的動作，
  // 在 Firebase 設定好之前會直接回報失敗，圖片仍然留在本機不受影響。
  async function uploadToCloud(id) {
    const image = images.find((item) => item.id === id)
    if (!image) return
    setCloudUploadingId(id)
    setError('')
    try {
      await uploadImageToCloud(image)
    } catch (err) {
      setError(err.message || '雲端上傳失敗')
    } finally {
      setCloudUploadingId(null)
    }
  }

  return {
    images,
    filteredImages,
    pagedImages,
    totalPages,
    currentPage,
    setCurrentPage,
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
    selectedIds,
    toggleSelect,
    clearSelection,
    previewImage,
    openPreview: setPreviewId,
    closePreview: () => setPreviewId(null),
    uploading,
    error,
    uploadFiles,
    reloadImages,
    cloudUploadingId,
    uploadToCloud,
    deleteImages,
    toggleFavorite: handleToggleFavorite,
    setWorkImage: handleSetWorkImage,
    setBreakImage: handleSetBreakImage,
    setIdleImage: handleSetIdleImage
  }
}

export default usePomodoroGallery
