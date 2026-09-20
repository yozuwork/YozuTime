import { useRef, useState } from 'react'
import Icon from '../Icon/Icon.jsx'
import CalmMedia from './CalmMedia.jsx'
import { formatClock } from '../../utils/pomodoro.js'
import { STORAGE_KEYS } from '../../utils/storageKeys.js'
import './PomodoroCalmView.css'

const MIN_FONT_SIZE = 40
const MAX_FONT_SIZE = 220
const DEFAULT_TRANSFORM = { x: 0, y: 0, fontSize: 104 }

function readTransform() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.pomodoroCalmTimeTransform)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_TRANSFORM }
    return { ...DEFAULT_TRANSFORM, ...parsed }
  } catch {
    return { ...DEFAULT_TRANSFORM }
  }
}

function writeTransform(transform) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.pomodoroCalmTimeTransform, JSON.stringify(transform))
  } catch {
    // 儲存空間不可用時忽略，僅本次畫面顯示受影響。
  }
}

// 滿版沉靜模式：蓋住整個瀏覽器畫面（含上方導覽列），畫面上只留倒數時間本身，不加任何其他文字或說明。
// 時間文字可以自由拖拉移動位置，拖右下角的小把手調整字級大小——跟浮動圖片（DraggableMedia）
// 同一套手勢邏輯：用 setPointerCapture 把移動/放開事件釘在同一個元素上，每次移動就直接存檔，
// 不用另外開 window 監聽或用 ref 補救閉包過期的問題。
function PomodoroCalmView({ image, remainingSeconds, isRunning, onTogglePause, onBack, onClose }) {
  const [transform, setTransform] = useState(readTransform)
  const dragRef = useRef(null)

  function persist(next) {
    setTransform(next)
    writeTransform(next)
  }

  function handlePanStart(event) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { mode: 'pan', startX: event.clientX, startY: event.clientY, origin: transform }
  }

  function handleResizeStart(event) {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { mode: 'resize', startX: event.clientX, startY: event.clientY, origin: transform }
  }

  function handlePointerMove(event) {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY

    if (drag.mode === 'pan') {
      persist({ ...drag.origin, x: drag.origin.x + dx, y: drag.origin.y + dy })
    } else {
      const delta = dx + dy
      const fontSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, drag.origin.fontSize + delta))
      persist({ ...drag.origin, fontSize })
    }
  }

  function handlePointerUp() {
    dragRef.current = null
  }

  return (
    <div className="pomodoro-calm-view">
      {image && <CalmMedia key={image.id} image={image} />}
      <div className="pomodoro-calm-gradient" aria-hidden="true" />

      <button type="button" className="pomodoro-calm-corner-btn pomodoro-calm-back" onClick={onBack} aria-label="返回">
        <Icon name="chevronLeft" size={20} />
      </button>
      <button type="button" className="pomodoro-calm-corner-btn pomodoro-calm-close" onClick={onClose} aria-label="關閉">
        <Icon name="x" size={20} />
      </button>

      <div
        className="pomodoro-calm-time-wrapper"
        style={{ transform: `translate(calc(-50% + ${transform.x}px), ${transform.y}px)` }}
      >
        <div
          className="pomodoro-calm-time"
          style={{ fontSize: `${transform.fontSize}px` }}
          onPointerDown={handlePanStart}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          title="拖曳移動位置"
        >
          {formatClock(remainingSeconds)}
        </div>
        <div
          className="pomodoro-calm-time-resize-handle"
          onPointerDown={handleResizeStart}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          title="拖曳調整字級大小"
        />
      </div>

      <button
        type="button"
        className="pomodoro-calm-pause"
        onClick={onTogglePause}
        aria-label={isRunning ? '暫停' : '繼續'}
      >
        <Icon name={isRunning ? 'pause' : 'play'} size={24} />
      </button>
    </div>
  )
}

export default PomodoroCalmView
