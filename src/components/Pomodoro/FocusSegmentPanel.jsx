import { useRef, useState } from 'react'
import Icon from '../Icon/Icon.jsx'
import MediaPreview from './MediaPreview.jsx'
import ImagePickerDialog from './ImagePickerDialog.jsx'
import { formatClock } from '../../utils/pomodoro.js'
import { addGalleryImage, readGalleryImages, validateGalleryFile } from '../../utils/imageStorage.js'
import {
  buildEvenSegments,
  createEmptySegment,
  formatSegmentDuration,
  getEffectiveSegments,
  getSegmentsTotalSeconds,
  writeFocusSegmentSettings
} from '../../utils/focusSegments.js'
import './FocusSegmentPanel.css'

// 常駐顯示在專注計時頁面上（不是彈窗、也不會被收合消失），這樣使用者可以同時看到
// 目前這次專注實際的時長（包含在計時圈上手動改過的分鐘數）再設定分段。
// 平均分段永遠用 totalSeconds（這次專注的實際總長，單位是秒）現算，不會停在設定當下的舊快照，
// 也不會因為用分鐘取整數，讓一分鐘分兩段這種情況把其中一段捨去成 0 分鐘。
function FocusSegmentPanel({ totalSeconds, state, onChange }) {
  const [pickerSegmentId, setPickerSegmentId] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const pendingSegmentIdRef = useRef(null)
  const galleryImages = readGalleryImages()

  // 開分段前既有的工作圖片：新出現的段落（剛啟用、或段數變多）預設帶這張，而不是空白，
  // 使用者原本設好的圖片才不會憑空消失。這裡故意在每個 handler 裡當下重新讀一次
  // localStorage，不是沿用 render 當下算好的 galleryImages——因為計時器沒在跑的時候，
  // 這個常駐面板可能在上傳完新圖片後完全不會重新 render，沿用 render 當下的值會抓到
  // 上傳之前的舊資料，導致明明已經有工作圖片，分段卻還是被存成空的。
  function getDefaultWorkImageId() {
    return readGalleryImages().find((item) => item.isWorkImage)?.id || null
  }

  function persist(next) {
    writeFocusSegmentSettings(next)
    onChange(next)
  }

  function handleToggleEnabled(event) {
    const enabled = event.target.checked
    const next = { ...state, enabled }
    if (enabled && next.segments.length < 2) {
      next.mode = 'even'
      next.segments = buildEvenSegments(totalSeconds, next.count || 2, next.segments, getDefaultWorkImageId())
    }
    if (enabled) {
      const defaultImageId = getDefaultWorkImageId()
      next.segments = next.segments.map((segment) => (
        segment.imageId ? segment : { ...segment, imageId: defaultImageId }
      ))
    }
    persist(next)
  }

  function handleModeChange(mode) {
    const next = { ...state, mode }
    if (mode === 'even') next.segments = buildEvenSegments(totalSeconds, next.count, state.segments, getDefaultWorkImageId())
    persist(next)
  }

  function handleCountChange(count) {
    const safeCount = Math.max(2, Math.min(12, Math.round(count) || 2))
    persist({
      ...state,
      count: safeCount,
      segments: buildEvenSegments(totalSeconds, safeCount, state.segments, getDefaultWorkImageId())
    })
  }

  // 自訂分段的輸入框仍然用「分鐘」讓使用者輸入（比較直覺），可以填小數（例如 0.5 = 30 秒），
  // 存起來的時候換算成秒，跟平均分段共用同一套以秒為單位的邏輯。
  function handleSegmentMinutesChange(id, minutesValue) {
    const seconds = Math.max(5, Math.round((Number(minutesValue) || 0) * 60))
    const segments = state.segments.map((segment) => (segment.id === id ? { ...segment, seconds } : segment))
    persist({ ...state, segments })
  }

  function handleAddSegment() {
    persist({ ...state, mode: 'custom', segments: [...state.segments, createEmptySegment(300, getDefaultWorkImageId())] })
  }

  function handleRemoveSegment(id) {
    if (state.segments.length <= 1) return
    persist({ ...state, segments: state.segments.filter((segment) => segment.id !== id) })
  }

  function handlePickExisting(imageId) {
    const segments = state.segments.map((segment) => (segment.id === pickerSegmentId ? { ...segment, imageId } : segment))
    persist({ ...state, segments })
    setPickerSegmentId(null)
  }

  function handleUploadNew() {
    pendingSegmentIdRef.current = pickerSegmentId
    setPickerSegmentId(null)
    inputRef.current?.click()
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validation = validateGalleryFile(file)
    if (!validation.ok) {
      setError(validation.error)
      return
    }

    try {
      const record = await addGalleryImage(file)
      const segments = state.segments.map((segment) =>
        segment.id === pendingSegmentIdRef.current ? { ...segment, imageId: record.id } : segment
      )
      persist({ ...state, segments })
      setError('')
    } catch {
      setError('上傳失敗，請改用較小的檔案')
    }
  }

  const displaySegments = getEffectiveSegments(state, totalSeconds)
  const displayTotalSeconds = getSegmentsTotalSeconds(displaySegments)
  const roundedTotalSeconds = Math.round(totalSeconds)
  const pickerIndex = displaySegments.findIndex((segment) => segment.id === pickerSegmentId)

  return (
    <div className="pomodoro-card focus-segment-panel">
      <div className="focus-segment-header">
        <h2>專注圖片分段</h2>
      </div>

      <label className="focus-segment-toggle">
        <input type="checkbox" checked={state.enabled} onChange={handleToggleEnabled} />
        啟用分段顯示
      </label>

      {state.enabled && (
        <>
          <div className="focus-segment-mode">
            <label>
              <input type="radio" checked={state.mode === 'even'} onChange={() => handleModeChange('even')} />
              平均分段
            </label>
            {state.mode === 'even' && (
              <span className="focus-segment-count">
                分成
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={state.count}
                  onChange={(event) => handleCountChange(event.target.value)}
                />
                段
              </span>
            )}
            <label>
              <input type="radio" checked={state.mode === 'custom'} onChange={() => handleModeChange('custom')} />
              自訂分段
            </label>
          </div>

          <div className="focus-timeline-scroll">
          <div className="focus-segment-list" style={{ minWidth: `${Math.max(280, displaySegments.length * 110)}px` }}>
            {displaySegments.map((segment, index) => {
              const image = galleryImages.find((item) => item.id === segment.imageId)
                || galleryImages.find((item) => item.isWorkImage)
                || null
              return (
                <div key={segment.id} className="focus-segment-row">
                  <span className="focus-segment-index">{index + 1}</span>
                  <button type="button" className="focus-segment-thumb" aria-label={`更換第 ${index + 1} 段圖片`} onClick={() => setPickerSegmentId(segment.id)}>
                    {image ? <MediaPreview image={image} alt={`第 ${index + 1} 段圖片`} /> : <Icon name="image" size={16} />}
                  </button>
                  {state.mode === 'even' ? (
                    <span className="focus-segment-duration">{formatSegmentDuration(segment.seconds)}</span>
                  ) : (
                    <label className="focus-segment-minutes">
                      <input
                        type="number"
                        min={0.1}
                        step={0.5}
                        value={Math.round((segment.seconds / 60) * 100) / 100}
                        onChange={(event) => handleSegmentMinutesChange(segment.id, event.target.value)}
                      />
                      分鐘
                    </label>
                  )}
                  {state.mode === 'custom' && displaySegments.length > 1 && (
                    <button
                      type="button"
                      className="focus-segment-remove"
                      onClick={() => handleRemoveSegment(segment.id)}
                      aria-label="刪除分段"
                    >
                      <Icon name="x" size={13} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <div className="focus-timeline-endpoints"><span>0:00</span><span>{formatClock(displayTotalSeconds)}</span></div>
          </div>

          {state.mode === 'custom' && (
            <button type="button" className="focus-segment-add" onClick={handleAddSegment}>
              <Icon name="plus" size={13} />
              新增分段
            </button>
          )}

          <p className="focus-segment-hint">
            目前分段總計 {formatSegmentDuration(displayTotalSeconds)}（這次專注時長 {formatSegmentDuration(roundedTotalSeconds)}）
            {displayTotalSeconds !== roundedTotalSeconds ? '，時間到了會停在最後一段畫面' : ''}
          </p>
        </>
      )}

      {error && <span className="focus-segment-error">{error}</span>}

      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/*,video/mp4,video/webm,video/quicktime"
        onChange={handleFileChange}
      />

      {pickerSegmentId && (
        <ImagePickerDialog
          label={`第 ${pickerIndex + 1} 段圖片`}
          onClose={() => setPickerSegmentId(null)}
          onPickExisting={handlePickExisting}
          onUploadNew={handleUploadNew}
        />
      )}
    </div>
  )
}

export default FocusSegmentPanel
