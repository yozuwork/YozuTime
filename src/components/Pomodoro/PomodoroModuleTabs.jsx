import './PomodoroModuleTabs.css'

const TABS = [
  { id: 'widget', label: '主頁面' },
  { id: 'focus', label: '專注計時' },
  { id: 'gallery', label: '圖庫' }
]

function PomodoroModuleTabs({ activeTab, onChange }) {
  return (
    <div className="pomodoro-module-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? 'is-active' : ''}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default PomodoroModuleTabs
