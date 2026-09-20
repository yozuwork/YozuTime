import GalleryCard from './GalleryCard.jsx'
import './Gallery.css'

function GalleryGrid({ images, selectedIds, onToggleSelect, onPreview, onToggleFavorite }) {
  return (
    <div className="gallery-grid">
      {images.map((image) => (
        <GalleryCard
          key={image.id}
          image={image}
          isSelected={selectedIds.includes(image.id)}
          onToggleSelect={onToggleSelect}
          onPreview={onPreview}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}

export default GalleryGrid
