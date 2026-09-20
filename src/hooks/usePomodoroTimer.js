import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { DEFAULT_POMODORO_SETTINGS } from '../data/pomodoroDefaults.js'
import { getModeMinutesKey, playCompletionBeep } from '../utils/pomodoro.js'

function readStoredState(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveStoredState(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 儲存空間不可用時維持目前工作階段，不中斷主要功能。
  }
}

function buildIdleTimer(mode, settings) {
  const totalSeconds = Math.max(60, Math.round(settings[getModeMinutesKey(mode)] * 60))
  return {
    mode,
    status: 'idle',
    totalSeconds,
    targetEndAt: null,
    pausedRemainingSeconds: totalSeconds,
    startedAt: null
  }
}

function isRestorableTimer(stored) {
  if (!stored || typeof stored !== 'object') return false
  if (stored.status === 'paused') return true
  if (stored.status === 'running') return typeof stored.targetEndAt === 'number' && stored.targetEndAt > Date.now()
  return false
}

// 番茄計時器：以 targetEndAt（結束時間戳記）推算剩餘秒數，而不是每秒遞減一個計數器，
// 避免背景分頁節流造成長時間累積誤差。
export function usePomodoroTimer(showToast) {
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_POMODORO_SETTINGS,
    ...readStoredState(STORAGE_KEYS.pomodoroSettings, {})
  }))
  const [timer, setTimer] = useState(() => {
    const stored = readStoredState(STORAGE_KEYS.pomodoroTimerState, null)
    if (isRestorableTimer(stored)) return stored
    return buildIdleTimer('focus', {
      ...DEFAULT_POMODORO_SETTINGS,
      ...readStoredState(STORAGE_KEYS.pomodoroSettings, {})
    })
  })
  const [now, setNow] = useState(() => Date.now())
  const timerRef = useRef(timer)
  const completingRef = useRef(false)

  useEffect(() => {
    timerRef.current = timer
  }, [timer])

  useEffect(() => saveStoredState(STORAGE_KEYS.pomodoroSettings, settings), [settings])
  useEffect(() => saveStoredState(STORAGE_KEYS.pomodoroTimerState, timer), [timer])

  // 只用來觸發重新渲染以重算 remainingSeconds，不是計時本身的依據。
  useEffect(() => {
    if (timer.status !== 'running') return undefined
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [timer.status])

  const remainingSeconds = useMemo(() => {
    if (timer.status === 'running') {
      return Math.max(0, Math.ceil((timer.targetEndAt - now) / 1000))
    }
    if (timer.status === 'completed') return 0
    return timer.pausedRemainingSeconds ?? timer.totalSeconds
  }, [timer, now])

  const percentage = timer.totalSeconds > 0
    ? Math.min(100, Math.max(0, ((timer.totalSeconds - remainingSeconds) / timer.totalSeconds) * 100))
    : 0

  const completeSession = useCallback(() => {
    if (completingRef.current) return
    completingRef.current = true

    const finished = timerRef.current
    const finishedMode = finished.mode

    setTimer((prev) => ({ ...prev, status: 'completed', pausedRemainingSeconds: 0 }))

    if (settings.soundEnabled) playCompletionBeep(settings.soundVolume)

    let nextMode = null
    if (finishedMode === 'focus') {
      nextMode = 'shortBreak'
      showToast?.('本次專注完成')
    } else {
      nextMode = 'focus'
      showToast?.(finishedMode === 'longBreak' ? '長休息結束' : '短休息結束')
    }

    const shouldAutoStart = finishedMode === 'focus' ? settings.autoStartBreak : settings.autoStartFocus
    window.setTimeout(() => {
      if (shouldAutoStart && nextMode) {
        const idleTimer = buildIdleTimer(nextMode, settings)
        setTimer({
          ...idleTimer,
          status: 'running',
          startedAt: new Date().toISOString(),
          targetEndAt: Date.now() + idleTimer.totalSeconds * 1000
        })
      }
      completingRef.current = false
    }, 300)
  }, [settings, showToast])

  // 計時到 0：只觸發一次完成流程（用 ref 防止 interval tick 重複觸發）。
  useEffect(() => {
    if (timer.status === 'running' && remainingSeconds <= 0) {
      completeSession()
    }
  }, [remainingSeconds, timer.status, completeSession])

  const start = useCallback(() => {
    setTimer((prev) => {
      if (prev.status === 'running') return prev
      const baseRemaining = prev.status === 'completed' ? prev.totalSeconds : (prev.pausedRemainingSeconds ?? prev.totalSeconds)
      return {
        ...prev,
        status: 'running',
        startedAt: prev.startedAt || new Date().toISOString(),
        targetEndAt: Date.now() + baseRemaining * 1000
      }
    })
  }, [])

  const pause = useCallback(() => {
    setTimer((prev) => {
      if (prev.status !== 'running') return prev
      const remaining = Math.max(0, Math.ceil((prev.targetEndAt - Date.now()) / 1000))
      return { ...prev, status: 'paused', pausedRemainingSeconds: remaining }
    })
  }, [])

  const reset = useCallback(() => {
    setTimer((prev) => buildIdleTimer(prev.mode, settings))
  }, [settings])

  // 直接覆寫「這一次」倒數的剩餘時間，不影響該模式的預設時長設定；
  // 運行中會重新計算 targetEndAt，其餘狀態則同時更新暫停時要用的剩餘秒數。
  const setRemainingMinutes = useCallback((minutes) => {
    const totalSeconds = Math.max(60, Math.round(minutes * 60))
    setTimer((prev) => {
      if (prev.status === 'running') {
        return { ...prev, totalSeconds, targetEndAt: Date.now() + totalSeconds * 1000 }
      }
      return {
        ...prev,
        status: prev.status === 'completed' ? 'idle' : prev.status,
        totalSeconds,
        pausedRemainingSeconds: totalSeconds
      }
    })
  }, [])

  // 切換模式（專注／短休息／長休息）前，若正在計時，交由呼叫端先跳確認 Dialog 避免誤觸，
  // 這裡只負責實際切換的邏輯本身。
  const switchMode = useCallback((mode) => {
    setTimer((prev) => (prev.mode === mode && prev.status === 'idle' ? prev : buildIdleTimer(mode, settings)))
  }, [settings])

  function updateSettings(partial) {
    setSettings((prev) => ({ ...prev, ...partial }))
  }

  // 設定的時間欄位變更時，若計時器還沒開始（idle），立刻反映新的分鐘數，
  // 否則使用者改了設定卻看不到倒數變化，會以為沒生效。
  useEffect(() => {
    setTimer((prev) => (prev.status === 'idle' ? buildIdleTimer(prev.mode, settings) : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.focusMinutes, settings.shortBreakMinutes, settings.longBreakMinutes])

  return {
    settings,
    updateSettings,
    timer,
    remainingSeconds,
    percentage,
    start,
    pause,
    reset,
    switchMode,
    setRemainingMinutes
  }
}
