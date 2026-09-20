import { useRef, useState } from 'react'
import Icon from '../../Icon/Icon.jsx'
import usePomodoroGallery from '../../../hooks/usePomodoroGallery.js'
import GalleryToolbar from './GalleryToolbar.jsx'
import GalleryGrid from './GalleryGrid.jsx'
import GallerySelectionBar from './GallerySelectionBar.jsx'
import GalleryPagination from './GalleryPagination.jsx'
import ImagePreviewModal from './ImagePreviewModal.jsx'
import ImageDeleteDialog from './ImageDeleteDialog.jsx'
import GalleryStorageSettings from './GalleryStorageSettings.jsx'
import './Gallery.css'

function PomodoroGalleryView() {
  const gallery = usePomodoroGallery()
  const [pendingDeleteIds, setPendingDeleteIds] = useState(null)
  const inputRef = useRef(null)

  function handleUploadChange(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (files.length) gallery.uploadFiles(files)
  }

  function confirmDelete() {
    if (pendingDeleteIds) gallery.deleteImages(pendingDeleteIds)
    setPendingDeleteIds(null)
  }

  const hasAnyImages = gallery.images.length > 0
  const hasResults = gallery.pagedImages.length > 0

  return (
    <section className="pomodoro-gallery-view">
      <header className="gallery-header">
        <div>
          <h1>
            圖庫 <span className="gallery-header-count">共 {gallery.images.length} 個檔案</span>
          </h1>
          <p>管理專注與休息時使用的圖片與影片，GIF、MP4 會自動循環播放</p>
        </div>
        <button type="button" className="gallery-upload-button" onClick={() => inputRef.current?.click()} disabled={gallery.uploading}>
          <Icon name="plus" size={15} />
          {gallery.uploading ? '上傳中...' : '上傳圖片／影片'}
        </button>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime"
          onChange={handleUploadChange}
        />
      </header>

      {gallery.error && <p className="gallery-error">{gallery.error}</p>}

      <GalleryStorageSettings onImported={gallery.reloadImages} />

      {hasAnyImages && (
        <GalleryToolbar
          category={gallery.category}
          onCategoryChange={gallery.setCategory}
          searchQuery={gallery.searchQuery}
          onSearchChange={gallery.setSearchQuery}
        />
      )}

      {!hasAnyImages && (
        <div className="gallery-empty-state">
          <Icon name="image" size={36} />
          <strong>你的圖庫還是空的</strong>
          <p>將喜歡的圖片或影片加入這裡，可以設定為專注或休息時的浮動圖片。</p>
          <button type="button" onClick={() => inputRef.current?.click()}>上傳第一個檔案</button>
        </div>
      )}

      {hasAnyImages && !hasResults && (
        <div className="gallery-empty-state">
          <Icon name="search" size={32} />
          {gallery.searchQuery.trim() ? (
            <>
              <strong>找不到相關圖片</strong>
              <p>試試其他關鍵字</p>
              <button type="button" onClick={() => gallery.setSearchQuery('')}>清除搜尋</button>
            </>
          ) : gallery.category === 'favorite' ? (
            <>
              <strong>目前沒有收藏圖片</strong>
              <p>點擊圖片上的 ☆ 即可加入我的最愛。</p>
            </>
          ) : (
            <strong>這個分類目前沒有圖片</strong>
          )}
        </div>
      )}

      {hasAnyImages && hasResults && (
        <>
          <GalleryGrid
            images={gallery.pagedImages}
            selectedIds={gallery.selectedIds}
            onToggleSelect={gallery.toggleSelect}
            onPreview={gallery.openPreview}
            onToggleFavorite={gallery.toggleFavorite}
          />

          <GalleryPagination
            currentPage={gallery.currentPage}
            totalPages={gallery.totalPages}
            onChange={gallery.setCurrentPage}
          />
        </>
      )}

      {gallery.selectedIds.length > 0 && (
        <GallerySelectionBar
          count={gallery.selectedIds.length}
          onDelete={() => setPendingDeleteIds(gallery.selectedIds)}
          onSetWork={() => gallery.setWorkImage(gallery.selectedIds[0])}
          onSetBreak={() => gallery.setBreakImage(gallery.selectedIds[0])}
          onSetIdle={() => gallery.setIdleImage(gallery.selectedIds[0])}
          onClear={gallery.clearSelection}
        />
      )}

      {gallery.previewImage && (
        <ImagePreviewModal
          image={gallery.previewImage}
          onClose={gallery.closePreview}
          onSetWork={gallery.setWorkImage}
          onSetBreak={gallery.setBreakImage}
          onSetIdle={gallery.setIdleImage}
          onUploadCloud={gallery.uploadToCloud}
          isUploadingCloud={gallery.cloudUploadingId === gallery.previewImage.id}
          onDelete={(id) => setPendingDeleteIds([id])}
        />
      )}

      {pendingDeleteIds && (
        <ImageDeleteDialog
          count={pendingDeleteIds.length}
          onCancel={() => setPendingDeleteIds(null)}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  )
}

export default PomodoroGalleryView
