import { useCallback, useState } from 'react'
import PomodoroView from './components/Pomodoro/PomodoroView.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

function App() {
  const [toast, setToast] = useState('')

  const showToast = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2000)
  }, [])

  return (
    <div className="app">
      <ErrorBoundary>
        <PomodoroView showToast={showToast} />
      </ErrorBoundary>
      {toast && <div className="app-toast">{toast}</div>}
    </div>
  )
}

export default App
