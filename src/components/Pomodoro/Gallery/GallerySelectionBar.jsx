import './Gallery.css'

function GallerySelectionBar({ count, onDelete, onSetWork, onSetBreak, onSetIdle, onClear }) {
  const singleSelected = count === 1

  return (
    <div className="gallery-selection-bar">
      <span>已選擇 {count} 張</span>
      <div className="gallery-selection-actions">
        <button type="button" className="gallery-selection-danger" onClick={onDelete}>刪除</button>
        <button
          type="button"
          disabled={!singleSelected}
          title={singleSelected ? '設為工作圖片' : '一次只能設定一張圖片'}
          onClick={onSetWork}
        >
          設為工作圖片
        </button>
        <button
          type="button"
          disabled={!singleSelected}
          title={singleSelected ? '設為休息圖片' : '一次只能設定一張圖片'}
          onClick={onSetBreak}
        >
          設為休息圖片
        </button>
        <button
          type="button"
          disabled={!singleSelected}
          title={singleSelected ? '設為待機圖片' : '一次只能設定一張圖片'}
          onClick={onSetIdle}
        >
          設為待機圖片
        </button>
        <button type="button" className="gallery-selection-clear" onClick={onClear}>取消選取</button>
      </div>
    </div>
  )
}

export default GallerySelectionBar
