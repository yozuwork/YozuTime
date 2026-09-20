import { useEffect, useRef, useState } from 'react'
import { readWidgetImageTransform, writeWidgetImageTransform } from '../../utils/pomodoroWidgetImages.js'
import MediaPreview from './MediaPreview.jsx'
import './DraggableMedia.css'

const MIN_SCALE = 1
const MAX_SCALE = 3

function clampScale(scale) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

// 讓浮動圖片可以直接在畫面上拖拉調整位置、拖角落調整大小；
// 每個欄位（工作／休息／待機）各自記住自己的位移與縮放比例。
function DraggableMedia({ slot, image, alt }) {
  const [transform, setTransform] = useState(() => readWidgetImageTransform(slot))
  const dragRef = useRef(null)

  useEffect(() => {
    setTransform(readWidgetImageTransform(slot))
  }, [slot])

  function persist(next) {
    setTransform(next)
    writeWidgetImageTransform(slot, next)
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
      const delta = (dx + dy) / 200
      persist({ ...drag.origin, scale: clampScale(drag.origin.scale + delta) })
    }
  }

  function handlePointerUp() {
    dragRef.current = null
  }

  function handleReset(event) {
    event.stopPropagation()
    persist({ x: 0, y: 0, scale: 1 })
  }

  return (
    <div
      className="draggable-media"
      onPointerDown={handlePanStart}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleReset}
      title="拖曳調整位置，拖右下角調整大小，雙擊重設"
    >
      <div
        className="draggable-media-content"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
      >
        <MediaPreview image={image} alt={alt} />
      </div>
      <div
        className="draggable-media-resize-handle"
        onPointerDown={handleResizeStart}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  )
}

export default DraggableMedia
