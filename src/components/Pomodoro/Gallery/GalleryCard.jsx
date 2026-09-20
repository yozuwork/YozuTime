import Icon from '../../Icon/Icon.jsx'
import MediaPreview from '../MediaPreview.jsx'
import './Gallery.css'

function GalleryCard({ image, isSelected, onToggleSelect, onPreview, onToggleFavorite }) {
  return (
    <div className={`gallery-card${isSelected ? ' is-selected' : ''}`} onClick={() => onPreview(image.id)}>
      <div className="gallery-card-image">
        <MediaPreview image={image} alt={image.name} loading="lazy" />

        <span
          role="checkbox"
          aria-checked={isSelected}
          tabIndex={0}
          className="gallery-card-checkbox"
          onClick={(event) => {
            event.stopPropagation()
            onToggleSelect(image.id)
          }}
        >
          {isSelected && <Icon name="checkSquare" size={13} />}
        </span>
      </div>

      <div className="gallery-card-footer">
        <span className="gallery-card-name" title={image.name}>{image.name}</span>
        <div className="gallery-card-tags">
          {image.isWorkImage && <span className="gallery-tag gallery-tag-work">工作</span>}
          {image.isBreakImage && <span className="gallery-tag gallery-tag-break">休息</span>}
          {image.isIdleImage && <span className="gallery-tag gallery-tag-idle">待機</span>}
          <button
            type="button"
            className={`gallery-card-favorite${image.isFavorite ? ' is-active' : ''}`}
            title={image.isFavorite ? '移除最愛' : '加入最愛'}
            onClick={(event) => {
              event.stopPropagation()
              onToggleFavorite(image.id)
            }}
          >
            <Icon name="star" size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default GalleryCard
