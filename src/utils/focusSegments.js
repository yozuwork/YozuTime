import { STORAGE_KEYS } from './storageKeys.js'

// 專注時間分段顯示：預設關閉，行為跟現在一樣只用單一「工作圖片」。
// 開啟後可以選「平均分段」（依專注時長自動平分）或「自訂分段」（每段自己設時間＋圖片）。
// 內部一律用「秒」為單位計算，不能用分鐘取整數——不然像 1 分鐘分兩段這種情況，
// 30/30 秒會被四捨五入成 0 分鐘／1 分鐘，短的那段變成 0 分鐘、永遠不會顯示。
const DEFAULT_STATE = { enabled: false, mode: 'even', count: 2, segments: [] }

export function readFocusSegmentSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.pomodoroFocusSegments)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_STATE }
    return { ...DEFAULT_STATE, ...parsed, segments: Array.isArray(parsed.segments) ? parsed.segments : [] }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function writeFocusSegmentSettings(state) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.pomodoroFocusSegments, JSON.stringify(state))
  } catch {
    // 儲存空間不可用時忽略，僅本次畫面顯示受影響。
  }
}

function makeSegmentId() {
  return `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function createEmptySegment(seconds = 300, imageId = null) {
  return { id: makeSegmentId(), imageId, seconds }
}

// 平均分成 count 段，除不盡的秒數併入最後一段，確保總和等於 totalSeconds。
// 盡量保留原本每段指定的圖片（依索引對齊）；新出現的段落（第一次啟用、或段數變多）
// 沒有舊圖片可以繼承時，用 defaultImageId（通常是啟用當下既有的工作圖片）帶入，
// 而不是留空——使用者開分段前就設好的圖片不該憑空消失。
export function buildEvenSegments(totalSeconds, count, previousSegments = [], defaultImageId = null) {
  const safeTotal = Math.max(1, Math.round(totalSeconds))
  const safeCount = Math.max(1, Math.round(count))
  const base = Math.floor(safeTotal / safeCount)
  const remainder = safeTotal - base * safeCount

  return Array.from({ length: safeCount }, (_, index) => ({
    id: previousSegments[index]?.id || makeSegmentId(),
    imageId: previousSegments[index]?.imageId || defaultImageId,
    seconds: base + (index === safeCount - 1 ? remainder : 0)
  }))
}

// 「平均分段」不該記住編輯當下的專注時長快照，不然專注時長改掉之後，分段還停在舊的總長度。
// 這裡永遠拿目前的 totalSeconds 現算，只有圖片指定（依索引對齊）是從 state.segments 保留下來的。
export function getEffectiveSegments(state, totalSeconds) {
  if (!state?.enabled) return []
  if (state.mode === 'even') return buildEvenSegments(totalSeconds, state.count, state.segments)
  return state.segments
}

// 依照專注開始後經過的秒數，找出目前該顯示哪一段。累加秒數第一個超過經過時間的
// 段落就是目前這段；如果分段總長比實際專注時間短，最後一段會撐到結束。
export function getActiveSegment(segments, elapsedSeconds) {
  if (!segments?.length) return null
  let cumulative = 0
  for (const segment of segments) {
    cumulative += Math.max(0, Number(segment.seconds) || 0)
    if (elapsedSeconds < cumulative) return segment
  }
  return segments[segments.length - 1]
}

export function getSegmentsTotalSeconds(segments) {
  return segments.reduce((sum, segment) => sum + (Number(segment.seconds) || 0), 0)
}

export function formatSegmentDuration(seconds) {
  const total = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  if (minutes === 0) return `${secs} 秒`
  if (secs === 0) return `${minutes} 分鐘`
  return `${minutes} 分 ${secs} 秒`
}
