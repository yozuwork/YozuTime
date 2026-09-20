import Icon from '../../Icon/Icon.jsx'
import { GALLERY_CATEGORIES } from '../../../hooks/usePomodoroGallery.js'
import './Gallery.css'

function GalleryToolbar({ category, onCategoryChange, searchQuery, onSearchChange }) {
  return (
    <div className="gallery-toolbar">
      <div className="gallery-toolbar-categories">
        {GALLERY_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={category === item.id ? 'is-active' : ''}
            onClick={() => onCategoryChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <label className="gallery-toolbar-search">
        <Icon name="search" size={14} />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜尋圖片..."
        />
      </label>
    </div>
  )
}

export default GalleryToolbar
