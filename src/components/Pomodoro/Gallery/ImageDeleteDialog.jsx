import Icon from '../../Icon/Icon.jsx'
import './Gallery.css'

function ImageDeleteDialog({ count, onCancel, onConfirm }) {
  return (
    <div className="gallery-modal-overlay" onMouseDown={onCancel}>
      <div className="gallery-delete-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <div className="gallery-modal-header">
          <h2>{count > 1 ? `刪除 ${count} 張圖片？` : '刪除圖片？'}</h2>
          <button type="button" onClick={onCancel} aria-label="關閉">
            <Icon name="x" size={17} />
          </button>
        </div>
        <p>圖片刪除後將無法復原。</p>
        <div className="gallery-delete-dialog-actions">
          <button type="button" className="secondary" onClick={onCancel}>取消</button>
          <button type="button" className="danger" onClick={onConfirm}>刪除</button>
        </div>
      </div>
    </div>
  )
}

export default ImageDeleteDialog
