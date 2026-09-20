import { useEffect, useRef, useState } from 'react'
import Icon from '../../Icon/Icon.jsx'
import { readGalleryImages } from '../../../utils/imageStorage.js'
import { exportGalleryBackup, importGalleryBackup } from '../../../utils/galleryBackup.js'
import {
  copyMediaFile,
  forgetFolder,
  getBackendStatus,
  getOpfsRootHandle,
  isFolderPickerSupported,
  pickFolder,
  reconnectFolder
} from '../../../utils/mediaFileStore.js'
import './Gallery.css'

function GalleryStorageSettings({ onImported }) {
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const importInputRef = useRef(null)

  useEffect(() => {
    refreshStatus()
  }, [])

  async function refreshStatus() {
    const next = await getBackendStatus()
    setStatus(next)
  }

  async function handlePickFolder() {
    setBusy('folder')
    setMessage('')
    try {
      const folderHandle = await pickFolder()
      // 選資料夾之前的圖片都存在 OPFS，先搬過去，圖庫才不會看起來突然空了。
      const opfsRoot = await getOpfsRootHandle()
      const records = readGalleryImages()
      for (const record of records) {
        if (!record.fileName) continue
        try {
          await copyMediaFile(record.fileName, opfsRoot, folderHandle)
        } catch {
          // 該檔案可能本來就不在 OPFS，略過即可
        }
      }
      await refreshStatus()
      setMessage('已連結資料夾，之後上傳的圖片／影片都會存在裡面')
    } catch (err) {
      if (err.name !== 'AbortError') setMessage(err.message || '選擇資料夾失敗')
    } finally {
      setBusy('')
    }
  }

  async function handleReconnect() {
    setBusy('reconnect')
    setMessage('')
    try {
      const ok = await reconnectFolder()
      setMessage(ok ? '已重新連結資料夾' : '取得授權失敗，請重新選擇資料夾')
      await refreshStatus()
    } finally {
      setBusy('')
    }
  }

  async function handleForget() {
    setBusy('forget')
    setMessage('')
    try {
      await forgetFolder()
      await refreshStatus()
      setMessage('已取消連結，之後改存在瀏覽器安全空間')
    } finally {
      setBusy('')
    }
  }

  async function handleExport() {
    setBusy('export')
    setMessage('')
    try {
      const count = await exportGalleryBackup()
      setMessage(count > 0 ? `已匯出 ${count} 個檔案` : '圖庫是空的，沒有東西可以匯出')
    } catch (err) {
      setMessage(err.message || '匯出失敗')
    } finally {
      setBusy('')
    }
  }

  async function handleImportChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy('import')
    setMessage('')
    try {
      const count = await importGalleryBackup(file)
      onImported?.()
      setMessage(`已還原 ${count} 個檔案`)
    } catch (err) {
      setMessage(err.message || '匯入失敗')
    } finally {
      setBusy('')
    }
  }

  if (!status) return null

  return (
    <div className="gallery-storage-settings">
      <div className="gallery-storage-status">
        <Icon name={status.backend === 'folder' ? 'folder' : 'image'} size={15} />
        {status.backend === 'folder' ? (
          status.needsReconnect ? (
            <span>資料夾「{status.folderName}」已中斷連結</span>
          ) : (
            <span>已連結資料夾：{status.folderName}</span>
          )
        ) : (
          <span>圖片存在瀏覽器安全空間（無需選擇資料夾）</span>
        )}
      </div>

      <div className="gallery-storage-actions">
        {status.backend === 'folder' && status.needsReconnect && (
          <button type="button" onClick={handleReconnect} disabled={busy !== ''}>
            {busy === 'reconnect' ? '連結中...' : '重新連結'}
          </button>
        )}

        {isFolderPickerSupported() && status.backend !== 'folder' && (
          <button type="button" onClick={handlePickFolder} disabled={busy !== ''}>
            {busy === 'folder' ? '選擇中...' : '選擇本機資料夾'}
          </button>
        )}

        {status.backend === 'folder' && (
          <button type="button" onClick={handleForget} disabled={busy !== ''}>
            {busy === 'forget' ? '處理中...' : '取消連結'}
          </button>
        )}

        <button type="button" onClick={handleExport} disabled={busy !== ''}>
          {busy === 'export' ? '匯出中...' : '匯出備份'}
        </button>

        <button type="button" onClick={() => importInputRef.current?.click()} disabled={busy !== ''}>
          {busy === 'import' ? '匯入中...' : '匯入備份'}
        </button>
        <input ref={importInputRef} type="file" accept=".zip" hidden onChange={handleImportChange} />
      </div>

      {message && <span className="gallery-storage-message">{message}</span>}
    </div>
  )
}

export default GalleryStorageSettings
