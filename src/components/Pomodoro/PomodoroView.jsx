import { useEffect, useState } from 'react'
import PomodoroTimerPanel from './PomodoroTimerPanel.jsx'
import PomodoroModuleTabs from './PomodoroModuleTabs.jsx'
import PomodoroGalleryView from './Gallery/PomodoroGalleryView.jsx'
import PomodoroWidgetView from './PomodoroWidgetView.jsx'
import { usePomodoroTimer } from '../../hooks/usePomodoroTimer.js'
import './PomodoroView.css'
import './FocusPage.css'

function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

function PomodoroView({ showToast }) {
  const pomodoro = usePomodoroTimer(showToast)
  const [activeTab, setActiveTab] = useState('focus')

  useEffect(() => {
    function handleKeyDown(event) {
      if (isTypingTarget(document.activeElement)) return

      if (event.code === 'Space') {
        event.preventDefault()
        if (pomodoro.timer.status === 'running') pomodoro.pause()
        else pomodoro.start()
      } else if (event.key.toLowerCase() === 'r') {
        pomodoro.reset()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pomodoro])

  return (
    <section className={`pomodoro-view${activeTab === 'widget' ? ' pomodoro-view-widget' : ''}${activeTab === 'focus' ? ' pomodoro-view-focus' : ''}`}>
      <PomodoroModuleTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'widget' && <PomodoroWidgetView pomodoro={pomodoro} onExit={() => setActiveTab('focus')} />}
      {activeTab === 'focus' && <PomodoroTimerPanel pomodoro={pomodoro} onOpenGallery={() => setActiveTab('gallery')} />}
      {activeTab === 'gallery' && <PomodoroGalleryView />}
    </section>
  )
}

export default PomodoroView
