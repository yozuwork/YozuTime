import { DROPLET_COLOR_PRESETS } from '../../data/pomodoroDefaults.js'
import './ColorPickerPanel.css'

function ColorPickerPanel({ color, onChange }) {
  return (
    <div className="color-picker-panel">
      <span className="color-picker-panel-title">主題色</span>
      <div className="color-picker-swatches">
        {DROPLET_COLOR_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="color-swatch"
            style={{ backgroundColor: preset.value }}
            aria-label={preset.label}
            aria-pressed={color === preset.value}
            title={preset.label}
            onClick={() => onChange(preset.value)}
          >
            {color === preset.value && (
              <svg className="color-swatch-check" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 12 9 17 20 6" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ColorPickerPanel
