export const DEFAULT_POMODORO_SETTINGS = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  dropletColor: '#e0645f',
  sandAnimationSpeed: 0.6,
  sandFallStyle: 'drops',
  autoStartBreak: false,
  autoStartFocus: false,
  soundEnabled: true,
  soundVolume: 0.7
}

export const DURATION_PRESETS = {
  focusMinutes: [15, 25, 45, 60],
  shortBreakMinutes: [5, 10, 15],
  longBreakMinutes: [15, 20, 30]
}

export const DURATION_LIMITS = {
  focusMinutes: [1, 180],
  shortBreakMinutes: [1, 60],
  longBreakMinutes: [1, 120]
}

export const DROPLET_COLOR_PRESETS = [
  { id: 'blue', label: '藍色', value: '#4f7df3' },
  { id: 'teal', label: '青綠色', value: '#2bb3a3' },
  { id: 'purple', label: '柔紫色', value: '#8b6fe0' },
  { id: 'coral', label: '珊瑚紅', value: '#e0645f' },
  { id: 'orange', label: '淡橘色', value: '#e0a04f' },
  { id: 'cyan', label: '青藍色', value: '#4fb3e0' }
]
