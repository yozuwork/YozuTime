import { useRef, useState } from 'react'
import MediaPreview from './MediaPreview.jsx'
import { readWidgetImageTransform, writeWidgetImageTransform } from '../../utils/pomodoroWidgetImages.js'

const DEFAULT = { x: 0, y: 0, scale: 1, fit: 'contain' }
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export default function CalmMedia({ image }) {
  const slot = `calm:${image.id}`
  const [position, setPosition] = useState(() => ({ ...DEFAULT, ...readWidgetImageTransform(slot) }))
  const [editing, setEditing] = useState(false)
  const drag = useRef(null)

  function update(next) {
    setPosition(next)
    writeWidgetImageTransform(slot, next)
  }

  function startDrag(event) {
    if (!editing || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const bounds = event.currentTarget.getBoundingClientRect()
    drag.current = { x: event.clientX, y: event.clientY, bounds, position }
  }

  function moveDrag(event) {
    if (!drag.current) return
    const origin = drag.current
    update({
      ...origin.position,
      x: clamp(origin.position.x + (event.clientX - origin.x) / origin.bounds.width * 100, -100, 100),
      y: clamp(origin.position.y + (event.clientY - origin.y) / origin.bounds.height * 100, -100, 100)
    })
  }

  return (
    <>
      <div className={`pomodoro-calm-media${editing ? ' is-editing' : ''}`}
        onPointerDown={startDrag} onPointerMove={moveDrag}
        onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}
        onLostPointerCapture={() => { drag.current = null }}>
        <div className="calm-media-content" style={{
          '--calm-image-fit': position.fit,
          transform: `translate(${position.x}%, ${position.y}%) scale(${position.scale})`
        }}>
          <MediaPreview image={image} alt="專注圖片" />
        </div>
      </div>
      <button type="button" className="calm-media-edit" aria-expanded={editing}
        aria-controls="calm-media-settings" onClick={() => setEditing(!editing)}>
        {editing ? '完成調整' : '調整圖片'}
      </button>
      {editing && (
        <div className="calm-media-settings" id="calm-media-settings" role="group" aria-label="圖片顯示範圍">
          <div className="calm-media-fit">
            <button type="button" aria-pressed={position.fit === 'contain'} onClick={() => update({ ...DEFAULT })}>完整顯示</button>
            <button type="button" aria-pressed={position.fit === 'cover'} onClick={() => update({ ...DEFAULT, fit: 'cover' })}>填滿畫面</button>
          </div>
          <p>拖曳圖片調整位置，或使用下方滑桿。</p>
          <label>縮放 <output>{Math.round(position.scale * 100)}%</output>
            <input type="range" min="0.5" max="3" step="0.01" value={position.scale}
              onChange={(event) => update({ ...position, scale: Number(event.target.value) })} />
          </label>
          <label>水平位置
            <input type="range" min="-100" max="100" value={position.x}
              onChange={(event) => update({ ...position, x: Number(event.target.value) })} />
          </label>
          <label>垂直位置
            <input type="range" min="-100" max="100" value={position.y}
              onChange={(event) => update({ ...position, y: Number(event.target.value) })} />
          </label>
          <button type="button" onClick={() => update({ ...DEFAULT })}>重設顯示範圍</button>
        </div>
      )}
    </>
  )
}
