import { useRef, useState } from 'react'
import Icon from '../Icon/Icon.jsx'
import { readPomodoroWidgetImages } from '../../utils/pomodoroWidgetImages.js'
import { addGalleryImage, setBreakImage, setIdleImage, setWorkImage, validateGalleryFile } from '../../utils/imageStorage.js'
import MediaPreview from './MediaPreview.jsx'
import ImagePickerDialog from './ImagePickerDialog.jsx'
import './PomodoroImagePanel.css'

const IMAGE_TYPES = [
  { id: 'focus', label: '工作圖片', hint: '專注時顯示' },
  { id: 'break', label: '休息圖片', hint: '短／長休息共用' },
  { id: 'idle', label: '待機圖片', hint: '倒數到 00:00 時顯示' }
]

const SETTERS = {
  focus: setWorkImage,
  break: setBreakImage,
  idle: setIdleImage
}

function PomodoroImagePanel({ onOpenGallery, segmentEnabled }) {
  const [images, setImages] = useState(readPomodoroWidgetImages)
  const [error, setError] = useState('')
  const [pickerType, setPickerType] = useState(null)
  const inputRef = useRef(null)
  const pendingTypeRef = useRef('focus')

  function closeDialog() {
    setPickerType(null)
  }

  function handlePickExisting(imageId) {
    SETTERS[pickerType](imageId)
    setImages(readPomodoroWidgetImages())
    closeDialog()
  }

  function handleUploadNew() {
    pendingTypeRef.current = pickerType
    closeDialog()
    inputRef.current?.click()
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validation = validateGalleryFile(file)
    if (!validation.ok) {
      setError(validation.error)
      return
    }

    try {
      const type = pendingTypeRef.current
      const record = await addGalleryImage(file)
      SETTERS[type](record.id)
      setImages(readPomodoroWidgetImages())
      setError('')
    } catch {
      setError('上傳失敗，請改用較小的檔案')
    }
  }

  const pickerLabel = IMAGE_TYPES.find((type) => type.id === pickerType)?.label

  return (
    <div className="pomodoro-image-panel">
      <span className="pomodoro-image-panel-title">浮動圖片</span>

      <div className="pomodoro-image-list">
        {IMAGE_TYPES.map((type) => (
          <div key={type.id} className="pomodoro-image-item">
            <button type="button" className="pomodoro-image-preview" title={`更換${type.label}`} onClick={() => setPickerType(type.id)}>
              {images[type.id] ? <MediaPreview image={images[type.id]} alt={type.label} /> : <Icon name="image" size={18} />}
            </button>
            <div className="pomodoro-image-item-info">
              <strong>{type.label}</strong>
              <small>{type.id === 'focus' && segmentEnabled ? `分段顯示中／${type.hint}` : type.hint}</small>
              <div className="pomodoro-image-actions">
                <button type="button" onClick={() => setPickerType(type.id)}>更換</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <span className="pomodoro-image-panel-error">{error}</span>}
      <input ref={inputRef} type="file" hidden accept="image/*,video/mp4,video/webm,video/quicktime" onChange={handleImageChange} />

      <button type="button" className="pomodoro-image-panel-gallery-link" onClick={onOpenGallery}>
        <Icon name="image" size={19} />
        前往圖庫
        <Icon name="chevronRight" size={13} />
      </button>

      {pickerType && (
        <ImagePickerDialog
          label={pickerLabel}
          onClose={closeDialog}
          onPickExisting={handlePickExisting}
          onUploadNew={handleUploadNew}
        />
      )}
    </div>
  )
}

export default PomodoroImagePanel
