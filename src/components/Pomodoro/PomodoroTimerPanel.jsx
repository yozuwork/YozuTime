import { useState } from 'react'
import LiquidTimer from './LiquidTimer.jsx'
import TimerControls from './TimerControls.jsx'
import ColorPickerPanel from './ColorPickerPanel.jsx'
import PomodoroImagePanel from './PomodoroImagePanel.jsx'
import TimerSettingsModal from './TimerSettingsModal.jsx'
import FocusSegmentPanel from './FocusSegmentPanel.jsx'
import { formatClock } from '../../utils/pomodoro.js'
import { readFocusSegmentSettings } from '../../utils/focusSegments.js'
import './PomodoroTimerPanel.css'

function PomodoroTimerPanel({ pomodoro, onOpenGallery }) {
  const { timer, remainingSeconds, percentage, settings, start, pause, reset, switchMode, updateSettings, setRemainingMinutes } = pomodoro
  const [showSettings, setShowSettings] = useState(false)
  const [segmentState, setSegmentState] = useState(readFocusSegmentSettings)

  function handleSwitchMode(mode) {
    if (timer.status === 'running') {
      const confirmed = window.confirm('切換模式會中斷目前的計時，確定要切換嗎？')
      if (!confirmed) return
    }
    switchMode(mode)
  }

  return (
    <div className="pomodoro-timer-panel">
      <div className="pomodoro-card pomodoro-main-card">
        <div className="pomodoro-main-card-body">
          <header className="focus-page-heading">
            <h1>專注計時</h1>
            <span className="focus-status" role="status">
              {timer.status === 'running' ? (timer.mode === 'focus' ? '專注中' : '休息中') : timer.status === 'paused' ? '已暫停' : timer.status === 'completed' ? '已完成' : '準備開始'}
            </span>
          </header>
          <LiquidTimer
            mode={timer.mode}
            status={timer.status}
            remainingLabel={formatClock(remainingSeconds)}
            remainingMinutes={Math.max(1, Math.ceil(remainingSeconds / 60))}
            onEditMinutes={setRemainingMinutes}
            percentage={percentage}
            color={settings.dropletColor}
            sandAnimationSpeed={settings.sandAnimationSpeed}
            sandFallStyle={settings.sandFallStyle}
          />
          <TimerControls
            mode={timer.mode}
            status={timer.status}
            shortBreakMinutes={settings.shortBreakMinutes}
            longBreakMinutes={settings.longBreakMinutes}
            onStart={start}
            onPause={pause}
            onReset={reset}
            onSwitchMode={handleSwitchMode}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>

        <aside className="pomodoro-main-side-panels">
          <h2>本次設定</h2>
          <ColorPickerPanel color={settings.dropletColor} onChange={(dropletColor) => updateSettings({ dropletColor })} />
          <PomodoroImagePanel onOpenGallery={onOpenGallery} segmentEnabled={segmentState.enabled} />
        </aside>
      </div>

      <FocusSegmentPanel totalSeconds={timer.totalSeconds} state={segmentState} onChange={setSegmentState} />

      {showSettings && (
        <TimerSettingsModal
          settings={settings}
          onChange={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default PomodoroTimerPanel
