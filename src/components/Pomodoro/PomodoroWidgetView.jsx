import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon/Icon.jsx'
import { formatClock, getModeMinutesKey } from '../../utils/pomodoro.js'
import { readPomodoroWidgetImages } from '../../utils/pomodoroWidgetImages.js'
import { readGalleryImages } from '../../utils/imageStorage.js'
import { getActiveSegment, getEffectiveSegments, readFocusSegmentSettings } from '../../utils/focusSegments.js'
import { STORAGE_KEYS } from '../../utils/storageKeys.js'
import DraggableMedia from './DraggableMedia.jsx'
import MediaPreview from './MediaPreview.jsx'
import PomodoroCalmView from './PomodoroCalmView.jsx'
import './PomodoroWidgetView.css'

const MODE_LABELS = {
  focus: '專注',
  shortBreak: '短休息',
  longBreak: '長休息'
}

const DEFAULT_CARD_SIZE = { width: 1400, height: 530 }
const MIN_CARD_WIDTH = 420
const MAX_CARD_WIDTH = 1400
const MIN_CARD_HEIGHT = 220
const MAX_CARD_HEIGHT = 800

function readCardSize() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.pomodoroWidgetCardSize)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_CARD_SIZE }
    if (parsed.width === 720 && parsed.height === 300) return { ...DEFAULT_CARD_SIZE }
    return { ...DEFAULT_CARD_SIZE, ...parsed }
  } catch {
    return { ...DEFAULT_CARD_SIZE }
  }
}

function writeCardSize(size) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.pomodoroWidgetCardSize, JSON.stringify(size))
  } catch {
    // 儲存空間不可用時忽略，僅本次畫面顯示受影響。
  }
}

// 精簡顯示模式：比照浮動小視窗的版面（圖片＋時間＋快速切換），
// 但內嵌在頁面裡，跟主頁共用同一份 usePomodoroTimer 狀態，不需要另外開視窗或輪詢 localStorage。
function PomodoroWidgetView({ pomodoro, onExit }) {
  const { timer, remainingSeconds, percentage, settings, start, pause, switchMode, setRemainingMinutes } = pomodoro
  const [isExpanded, setIsExpanded] = useState(true)
  const [isClockCollapsed, setIsClockCollapsed] = useState(false)
  const [displayMode, setDisplayMode] = useState('both')
  const [isCalmMode, setIsCalmMode] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [widgetImages] = useState(readPomodoroWidgetImages)
  const [focusSegmentState] = useState(readFocusSegmentSettings)
  const [galleryImages] = useState(readGalleryImages)
  const [cardSize, setCardSize] = useState(readCardSize)
  const cardResizeRef = useRef(null)

  useEffect(() => {
    if (displayMode === 'both') return
    function exitSingleView(event) {
      if (event.key === 'Escape') setDisplayMode('both')
    }
    window.addEventListener('keydown', exitSingleView)
    return () => window.removeEventListener('keydown', exitSingleView)
  }, [displayMode])

  const isRunning = timer.status === 'running'
  const isIdle = !isRunning || remainingSeconds === 0
  const activeImageType = isIdle ? 'idle' : timer.mode === 'focus' ? 'focus' : 'break'

  // 專注分段顯示：平均分段永遠依「這次專注實際的總秒數」現算每段長度，
  // 使用者中途用計時圈直接改剩餘分鐘數、或分段設好之後才調整專注時長，都不會停在舊的總長度。
  const focusSegmentImage = useMemo(() => {
    if (activeImageType !== 'focus' || !focusSegmentState.enabled) return null
    const effectiveSegments = getEffectiveSegments(focusSegmentState, timer.totalSeconds)
    if (!effectiveSegments.length) return null
    const elapsedSeconds = Math.max(0, timer.totalSeconds - remainingSeconds)
    const segment = getActiveSegment(effectiveSegments, elapsedSeconds)
    return segment?.imageId ? galleryImages.find((item) => item.id === segment.imageId) || null : null
  }, [activeImageType, focusSegmentState, timer.totalSeconds, remainingSeconds, galleryImages])

  const activeImage = focusSegmentImage || widgetImages[activeImageType]
  const activeImageLabel = activeImageType === 'focus' ? '工作圖片' : activeImageType === 'break' ? '休息圖片' : '待機圖片'
  const remainingMinutes = Math.max(1, Math.ceil(remainingSeconds / 60))

  function handleTogglePause() {
    if (isRunning) pause()
    else start()
  }

  function startMode(mode) {
    switchMode(mode)
    start()
  }

  function handleQuickMode(mode) {
    if (timer.mode === mode && timer.status !== 'completed') {
      handleTogglePause()
      return
    }
    startMode(mode)
  }

  function startEditing() {
    setDraft(String(remainingMinutes))
    setIsEditing(true)
  }

  function commitEditing() {
    const parsed = Number(draft)
    if (Number.isFinite(parsed) && parsed > 0) setRemainingMinutes(parsed)
    setIsEditing(false)
  }

  // 卡片本身（電腦版）可以拖右下角把手放大縮小，跟浮動圖片的拖拉手感一致：
  // setPointerCapture 把移動/放開事件釘在把手上，每次移動就直接存檔。
  function handleCardResizeStart(event) {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    cardResizeRef.current = { startX: event.clientX, startY: event.clientY, origin: cardSize }
  }

  function handleCardResizeMove(event) {
    const drag = cardResizeRef.current
    if (!drag) return
    const width = Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_WIDTH, drag.origin.width + (event.clientX - drag.startX)))
    const height = Math.min(MAX_CARD_HEIGHT, Math.max(MIN_CARD_HEIGHT, drag.origin.height + (event.clientY - drag.startY)))
    const next = { width, height }
    setCardSize(next)
    writeCardSize(next)
  }

  function handleCardResizeEnd() {
    cardResizeRef.current = null
  }

  function handleResetCardSize() {
    cardResizeRef.current = null
    const next = { ...DEFAULT_CARD_SIZE }
    setCardSize(next)
    writeCardSize(next)
  }

  if (isCalmMode) {
    return (
      <PomodoroCalmView
        image={activeImage}
        remainingSeconds={remainingSeconds}
        isRunning={isRunning}
        onTogglePause={handleTogglePause}
        onBack={() => setIsCalmMode(false)}
        onClose={() => setIsCalmMode(false)}
      />
    )
  }

  if (displayMode === 'media') {
    return (
      <div className="pomodoro-media-only" onDoubleClick={() => setDisplayMode('both')}>
        {activeImage && <MediaPreview image={activeImage} alt="" />}
        <button type="button" className="pomodoro-media-only-close" aria-label="關閉圖片滿版，返回主頁面" title="返回主頁面"
          onClick={() => setDisplayMode('both')}>
          <Icon name="x" size={22} />
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="pomodoro-display-options" role="group" aria-label="主頁面顯示方式">
        <button type="button" aria-pressed={displayMode === 'both' && !isClockCollapsed} onClick={() => { setDisplayMode('both'); setIsExpanded(true); setIsClockCollapsed(false) }}>左右並排</button>
        <button type="button" onClick={() => setDisplayMode('media')} title="按 Esc 或雙擊畫面返回">只顯示圖片／影片</button>
        <button type="button" aria-pressed={displayMode === 'timer'} onClick={() => setDisplayMode('timer')}>只顯示計時器</button>
        <button type="button" onClick={handleResetCardSize} title="恢復卡片預設寬度與高度">恢復預設大小</button>
        <small>單側顯示可按 Esc 返回；純圖片／影片亦可雙擊返回。</small>
      </div>
    <div
      className={`pomodoro-widget-view${isExpanded ? ' is-expanded' : ''}${displayMode === 'timer' ? ' is-timer-only' : ''}${isClockCollapsed && displayMode === 'both' ? ' is-clock-collapsed' : ''}`}
      style={{
        '--pomodoro-color': settings.dropletColor,
        '--card-max-width': `${cardSize.width}px`,
        '--card-height': `${cardSize.height}px`
      }}
    >
      {isExpanded && displayMode === 'both' && (
        <section className="pomodoro-widget-image-panel">
          <div className={`pomodoro-widget-image-picker${activeImage ? ' has-image' : ''}`}>
            {activeImage ? (
              <DraggableMedia slot={activeImageType} image={activeImage} alt={activeImageLabel} />
            ) : (
              <span className="pomodoro-widget-image-placeholder">
                <Icon name="image" size={26} />
                <strong>尚未設定{activeImageLabel}</strong>
                <small>請到專注計時頁面上傳</small>
              </span>
            )}
            <span className="pomodoro-widget-image-mode-badge">{activeImageLabel}</span>
          </div>
        </section>
      )}

      {isClockCollapsed && displayMode === 'both' && (
        <button type="button" className="pomodoro-widget-restore-clock" title="展開計時器" aria-label="展開計時器" aria-expanded={false} onClick={() => setIsClockCollapsed(false)}>
          <Icon name="chevronLeft" size={18} />
        </button>
      )}

      <section className="pomodoro-widget-clock">
        <div className="pomodoro-widget-fill" style={{ height: `${percentage}%` }} aria-hidden="true" />

        <button
          type="button"
          className="pomodoro-widget-expand"
          title={isExpanded ? '收合圖片' : '展開圖片'}
          aria-label={isExpanded ? '收合圖片' : '展開圖片'}
          aria-expanded={isExpanded}
          onClick={() => { setDisplayMode('both'); setIsExpanded((value) => displayMode === 'timer' ? true : !value) }}
        >
          <Icon name="chevronRight" size={13} />
        </button>

        <button type="button" className="pomodoro-widget-collapse-clock" title="收合計時器，只在卡片內顯示圖片" aria-label="收合計時器" aria-expanded={true}
          onClick={() => { setIsExpanded(true); setDisplayMode('both'); setIsClockCollapsed(true) }}>
          <Icon name="chevronRight" size={18} />
        </button>

        <button type="button" className="pomodoro-widget-close" aria-label="返回完整顯示" title="返回完整顯示" onClick={displayMode === 'timer' ? () => setDisplayMode('both') : onExit}>
          <Icon name="x" size={12} />
        </button>

        <button type="button" className="pomodoro-widget-calm-entry" title="沉靜模式" aria-label="進入沉靜模式" onClick={() => setIsCalmMode(true)}>
          <Icon name="maximize" size={12} />
        </button>

        <span className="pomodoro-widget-mode">{MODE_LABELS[timer.mode] || '專注'}{isRunning ? '中' : timer.status === 'paused' ? '已暫停' : ''}</span>

        {isEditing ? (
          <input
            type="number"
            className="pomodoro-widget-time pomodoro-widget-time-input"
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
          />
        ) : (
          <button type="button" className="pomodoro-widget-time" onClick={startEditing} title="點擊輸入分鐘數">
            {formatClock(remainingSeconds)}
          </button>
        )}

        <span className="pomodoro-widget-duration">本次{MODE_LABELS[timer.mode]} {Math.round(timer.totalSeconds / 60 * 10) / 10} 分鐘</span>

        <button
          type="button"
          className="pomodoro-widget-toggle"
          title={isRunning ? '暫停' : timer.status === 'paused' ? '繼續' : '開始'}
          aria-label={isRunning ? '暫停' : timer.status === 'paused' ? '繼續' : '開始'}
          onClick={handleTogglePause}
        >
          <Icon name={isRunning ? 'pause' : 'play'} size={16} />
        </button>

        <div className="pomodoro-widget-quick-actions">
          <button
            type="button"
            disabled={isRunning && remainingSeconds > 0}
            title={`短休息 ${settings[getModeMinutesKey('shortBreak')]} 分鐘`}
            onClick={() => handleQuickMode('shortBreak')}
          >
            休息
          </button>
          <button
            type="button"
            disabled={isRunning && remainingSeconds > 0}
            title={`專注 ${settings[getModeMinutesKey('focus')]} 分鐘`}
            onClick={() => handleQuickMode('focus')}
          >
            專注
          </button>
        </div>
      </section>

      <div
        className="pomodoro-widget-resize-handle"
        onPointerDown={handleCardResizeStart}
        onPointerMove={handleCardResizeMove}
        onPointerUp={handleCardResizeEnd}
        title="拖曳調整卡片大小"
      />
    </div>
    </>
  )
}

export default PomodoroWidgetView
