import { useState } from 'react'
import Icon from '../Icon/Icon.jsx'
import { DURATION_LIMITS, DURATION_PRESETS } from '../../data/pomodoroDefaults.js'
import './TimerSettingsModal.css'

const FIELDS = [
  { key: 'focusMinutes', label: '專注時長' },
  { key: 'shortBreakMinutes', label: '短休息' },
  { key: 'longBreakMinutes', label: '長休息' }
]

function clamp(value, [min, max]) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

function DurationField({ label, fieldKey, value, onChange }) {
  const [draft, setDraft] = useState(String(value))
  const limits = DURATION_LIMITS[fieldKey]

  function commitDraft() {
    const parsed = clamp(Number(draft), limits)
    setDraft(String(parsed))
    onChange(parsed)
  }

  return (
    <div className="timer-settings-field">
      <span className="timer-settings-field-label">{label}</span>
      <div className="timer-settings-presets">
        {DURATION_PRESETS[fieldKey].map((minutes) => (
          <button
            key={minutes}
            type="button"
            className={value === minutes ? 'is-active' : ''}
            onClick={() => {
              setDraft(String(minutes))
              onChange(minutes)
            }}
          >
            {minutes} 分鐘
          </button>
        ))}
      </div>
      <label className="timer-settings-custom">
        自訂
        <input
          type="number"
          min={limits[0]}
          max={limits[1]}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
        />
        分鐘
      </label>
    </div>
  )
}

function TimerSettingsModal({ settings, onChange, onClose }) {
  return (
    <div className="timer-settings-overlay" onMouseDown={onClose}>
      <div className="timer-settings-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="timer-settings-header">
          <h2>時間設定</h2>
          <button type="button" onClick={onClose} aria-label="關閉">
            <Icon name="x" size={17} />
          </button>
        </div>

        {FIELDS.map(({ key, label }) => (
          <DurationField
            key={key}
            label={label}
            fieldKey={key}
            value={settings[key]}
            onChange={(minutes) => onChange({ [key]: minutes })}
          />
        ))}
      </div>
    </div>
  )
}

export default TimerSettingsModal
