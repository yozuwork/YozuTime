import { readGalleryImages } from './imageStorage.js'
import { STORAGE_KEYS } from './storageKeys.js'

// 計時器只需要知道「目前的工作/休息/待機圖片是誰」，實際圖片管理都交給圖庫（imageStorage）。
export function readPomodoroWidgetImages() {
  const images = readGalleryImages()
  return {
    focus: images.find((item) => item.isWorkImage) || null,
    break: images.find((item) => item.isBreakImage) || null,
    idle: images.find((item) => item.isIdleImage) || null
  }
}

const DEFAULT_TRANSFORM = { x: 0, y: 0, scale: 1 }

// 每個圖片欄位（工作／休息／待機）各自記住使用者拖拉調整過的位置與縮放比例。
export function readWidgetImageTransform(slot) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.pomodoroWidgetImageTransform)
    const all = raw ? JSON.parse(raw) : {}
    return { ...DEFAULT_TRANSFORM, ...all[slot] }
  } catch {
    return { ...DEFAULT_TRANSFORM }
  }
}

export function writeWidgetImageTransform(slot, transform) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.pomodoroWidgetImageTransform)
    const all = raw ? JSON.parse(raw) : {}
    all[slot] = transform
    window.localStorage.setItem(STORAGE_KEYS.pomodoroWidgetImageTransform, JSON.stringify(all))
  } catch {
    // 儲存空間不可用時忽略，僅本次畫面顯示受影響。
  }
}
