import { useState } from 'react'
import Icon from '../Icon/Icon.jsx'
import { readGalleryImages } from '../../utils/imageStorage.js'
import MediaPreview from './MediaPreview.jsx'
import './ImagePickerDialog.css'

function ImagePickerDialog({ label, onClose, onPickExisting, onUploadNew }) {
  const [images] = useState(readGalleryImages)

  return (
    <div className="image-picker-overlay" onMouseDown={onClose}>
      <div className="image-picker-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <div className="image-picker-header">
          <h2>選擇{label}</h2>
          <button type="button" onClick={onClose} aria-label="關閉">
            <Icon name="x" size={17} />
          </button>
        </div>

        <button type="button" className="image-picker-upload-button" onClick={onUploadNew}>
          <Icon name="plus" size={15} />
          從本機上傳新檔案
        </button>

        {images.length > 0 ? (
          <>
            <span className="image-picker-section-title">或從圖庫選擇</span>
            <div className="image-picker-grid">
              {images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  className="image-picker-item"
                  title={image.name}
                  onClick={() => onPickExisting(image.id)}
                >
                  <MediaPreview image={image} alt={image.name} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="image-picker-empty">圖庫目前還沒有圖片，請先從本機上傳。</p>
        )}
      </div>
    </div>
  )
}

export default ImagePickerDialog
