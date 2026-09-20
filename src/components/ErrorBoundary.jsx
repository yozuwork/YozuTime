import { Component } from 'react'

// 開發時常會遇到 HMR 在刪檔/大改動後沒接乾淨，導致某個元件丟出例外——
// 沒有這層邊界的話 React 會整棵樹靜默解除掛載，畫面上所有按鈕看起來都「沒反應」。
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-error">
          <strong>畫面發生錯誤</strong>
          <p>{this.state.error.message}</p>
          <button type="button" onClick={() => window.location.reload()}>重新載入</button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
