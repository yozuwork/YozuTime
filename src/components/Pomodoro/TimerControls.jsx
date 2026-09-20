import Icon from '../Icon/Icon.jsx'
import './TimerControls.css'

function TimerControls({ status, mode, shortBreakMinutes, longBreakMinutes, onStart, onPause, onReset, onSwitchMode, onOpenSettings }) {
  const isRunning = status === 'running'

  return (
    <div className="timer-controls">
      <div className="timer-controls-main">
        <button type="button" className="timer-primary-btn" onClick={isRunning ? onPause : onStart}>
          <Icon name={isRunning ? 'pause' : 'play'} size={16} />
          {isRunning ? '暫停' : status === 'paused' ? '繼續' : mode === 'focus' ? '開始專注' : '開始休息'}
        </button>
        <button type="button" className="timer-reset-btn" aria-label="重設" title="重設" onClick={onReset}>
          <Icon name="refresh" size={16} />
        </button>
        <button type="button" className="timer-reset-btn" aria-label="時間設定" title="時間設定" onClick={onOpenSettings}>
          <Icon name="settings" size={16} />
        </button>
      </div>

      <div className="timer-break-buttons">
        <button type="button" className="timer-break-btn" onClick={() => onSwitchMode('shortBreak')}>
          <Icon name="coffee" size={15} />
          短休息 {shortBreakMinutes} 分鐘
        </button>
        <button type="button" className="timer-break-btn" onClick={() => onSwitchMode('longBreak')}>
          <Icon name="bed" size={15} />
          長休息 {longBreakMinutes} 分鐘
        </button>
      </div>
    </div>
  )
}

export default TimerControls
