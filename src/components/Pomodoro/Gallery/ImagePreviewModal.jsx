import Icon from '../../Icon/Icon.jsx'
import { formatBytes } from '../../../utils/imageStorage.js'
import MediaPreview from '../MediaPreview.jsx'
import './Gallery.css'

function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('zh-TW')
}

function ImagePreviewModal({ image, onClose, onSetWork, onSetBreak, onSetIdle, onUploadCloud, isUploadingCloud, onDelete }) {
  return (
    <div className="gallery-modal-overlay" onMouseDown={onClose}>
      <div className="gallery-preview-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="gallery-preview-close" onClick={onClose} aria-label="關閉">
          <Icon name="x" size={18} />
        </button>

        <div className="gallery-preview-image">
          <MediaPreview image={image} alt={image.name} />
        </div>

        <div className="gallery-preview-info">
          <h2 title={image.name}>{image.name}</h2>

          <dl>
            <div>
              <dt>解析度</dt>
              <dd>{image.width && image.height ? `${image.width} × ${image.height}` : '—'}</dd>
            </div>
            <div>
              <dt>檔案大小</dt>
              <dd>{formatBytes(image.size)}</dd>
            </div>
            <div>
              <dt>加入日期</dt>
              <dd>{formatDate(image.createdAt)}</dd>
            </div>
            <div>
              <dt>使用狀態</dt>
              <dd>
                {image.isWorkImage && <span className="gallery-tag gallery-tag-work">工作</span>}
                {image.isBreakImage && <span className="gallery-tag gallery-tag-break">休息</span>}
                {image.isIdleImage && <span className="gallery-tag gallery-tag-idle">待機</span>}
                {!image.isWorkImage && !image.isBreakImage && !image.isIdleImage && '未使用'}
              </dd>
            </div>
          </dl>

          <div className="gallery-preview-actions">
            <button type="button" onClick={() => onSetWork(image.id)}>設為工作圖片</button>
            <button type="button" onClick={() => onSetBreak(image.id)}>設為休息圖片</button>
            <button type="button" onClick={() => onSetIdle(image.id)}>設為待機圖片</button>
            <button type="button" disabled={isUploadingCloud} onClick={() => onUploadCloud(image.id)}>
              {isUploadingCloud ? '上傳雲端中...' : '上傳到雲端'}
            </button>
            <button type="button" className="danger" onClick={() => onDelete(image.id)}>刪除</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImagePreviewModal
