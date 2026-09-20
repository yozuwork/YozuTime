// 番茄時鐘共用小工具：時間格式化、對應設定欄位、簡短完成提示音。
export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const remainSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainSeconds).padStart(2, '0')}`
}

export function getModeMinutesKey(mode) {
  if (mode === 'shortBreak') return 'shortBreakMinutes'
  if (mode === 'longBreak') return 'longBreakMinutes'
  return 'focusMinutes'
}

// 用 Web Audio API 產生一段極短的提示音，避免額外打包音檔資源；
// 播放失敗（例如瀏覽器尚未有使用者互動）時安靜地略過，不影響計時完成流程本身。
export function playCompletionBeep(volume = 0.7) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.value = Math.min(1, Math.max(0, volume)) * 0.25
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
    oscillator.stop(ctx.currentTime + 0.6)
    oscillator.onended = () => ctx.close()
  } catch {
    // 提示音非核心功能，播放失敗不需要中斷或提示使用者。
  }
}
