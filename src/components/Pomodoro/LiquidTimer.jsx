import { useState } from 'react'
import './LiquidTimer.css'

const STATUS_LABELS = {
  focus: '專注中',
  shortBreak: '短休息中',
  longBreak: '長休息中'
}

function LiquidTimer({
  mode,
  status,
  remainingLabel,
  remainingMinutes,
  percentage,
  color,
  sandAnimationSpeed = 0.6,
  sandFallStyle = 'drops',
  onEditMinutes
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const isRunning = status === 'running'
  const isCompleted = status === 'completed'
  const label = isCompleted ? '本次專注完成' : STATUS_LABELS[mode] || '專注'
  const speed = Math.min(1.5, Math.max(0.4, Number(sandAnimationSpeed) || 0.6))
  const moundHeight = percentage > 0 ? Math.min(34, Math.sqrt(percentage) * 3.4) : 0
  const moundWidth = percentage > 0 ? Math.min(244, 28 + moundHeight * 6.2) : 0
  const className = [
    'liquid-timer',
    isRunning ? 'is-running' : '',
    sandFallStyle === 'stream' ? 'sand-style-stream' : 'sand-style-drops'
  ].filter(Boolean).join(' ')

  function startEditing() {
    if (!onEditMinutes) return
    setDraft(String(remainingMinutes))
    setIsEditing(true)
  }

  function commitEditing() {
    const parsed = Number(draft)
    if (Number.isFinite(parsed) && parsed > 0) onEditMinutes(parsed)
    setIsEditing(false)
  }

  return (
    <div
      className={className}
      style={{
        '--focus-color': color,
        '--sand-progress': `${percentage}%`,
        '--sand-mound-height': `${moundHeight}px`,
        '--sand-mound-width': `${moundWidth}px`,
        '--sand-fall-duration': `${1.8 / speed}s`,
        '--sand-drift-duration': `${4 / speed}s`,
        '--sand-secondary-drift-duration': `${6.2 / speed}s`
      }}
    >
      <div className="liquid-timer-ring">
        <div className="liquid-timer-clip">
          <div className="liquid-timer-fill" style={{ height: `${percentage}%` }} />
          <div className="liquid-timer-sand-fall" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className="liquid-timer-center">
          {isEditing ? (
            <input
              type="number"
              className="liquid-timer-time liquid-timer-time-input"
              min="1"
              max="999"
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitEditing}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur()
                if (event.key === 'Escape') setIsEditing(false)
              }}
              onClick={(event) => event.stopPropagation()}
            />
          ) : (
            <button
              type="button"
              className="liquid-timer-time"
              onClick={startEditing}
              disabled={!onEditMinutes}
              title={onEditMinutes ? '點擊輸入分鐘數' : undefined}
            >
              {remainingLabel}
            </button>
          )}
          <span className="liquid-timer-label">{label}</span>
        </div>

        <span className="liquid-timer-percentage">{Math.round(percentage)}%</span>
      </div>
    </div>
  )
}

export default LiquidTimer
