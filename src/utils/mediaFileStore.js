// 圖庫的實體檔案儲存層。之前把每張圖的 dataURL 塞進 localStorage 的單一字串裡，
// 容量只有約 5MB，一支影片或幾張圖就會爆掉，寫入失敗還會被靜默吞掉。
// 這裡改成兩種後端，容量都是幾百 MB 以上起跳：
//   - 'folder'：使用者透過 File System Access API 選擇的本機資料夾（目前只有桌面版 Chrome/Edge 支援）。
//   - 'opfs'：瀏覽器的 Origin Private File System，Safari／Chrome／Firefox 現行版本都支援，
//             不用使用者選擇、也不會每次重開就要求重新授權，手機（含 iPhone）預設就是走這條路。
// imageStorage.js 只認識這幾個函式，不需要知道目前實際存在資料夾還是 OPFS。

const HANDLE_DB_NAME = 'yozutime-media-handles'
const HANDLE_STORE = 'handles'
const HANDLE_KEY = 'gallery-folder'

function openHandleDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(HANDLE_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveFolderHandle(handle) {
  const db = await openHandleDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite')
    tx.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

async function loadFolderHandle() {
  const db = await openHandleDb()
  const handle = await new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readonly')
    const request = tx.objectStore(HANDLE_STORE).get(HANDLE_KEY)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return handle
}

async function clearFolderHandle() {
  const db = await openHandleDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite')
    tx.objectStore(HANDLE_STORE).delete(HANDLE_KEY)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export function isFolderPickerSupported() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

let opfsRootPromise = null
function getOpfsRoot() {
  if (!opfsRootPromise) {
    opfsRootPromise = navigator.storage.getDirectory().then((root) => root.getDirectoryHandle('gallery', { create: true }))
  }
  return opfsRootPromise
}

// 資料夾授權在重新整理頁面後不會自動延續，要先確認權限還在，過期的話回傳 null
// 讓呼叫端自動退回 OPFS，而不是整個功能壞掉。
async function getGrantedFolderHandle() {
  const handle = await loadFolderHandle().catch(() => null)
  if (!handle) return null
  try {
    const permission = await handle.queryPermission({ mode: 'readwrite' })
    return permission === 'granted' ? handle : null
  } catch {
    return null
  }
}

export async function pickFolder() {
  if (!isFolderPickerSupported()) {
    throw new Error('這個瀏覽器不支援選擇本機資料夾，請改用自動儲存')
  }
  const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
  const permission = await handle.requestPermission({ mode: 'readwrite' })
  if (permission !== 'granted') {
    throw new Error('未取得資料夾寫入權限')
  }
  await saveFolderHandle(handle)
  return handle
}

export async function forgetFolder() {
  await clearFolderHandle()
}

// 重新整理後資料夾權限失效時，用同一個 handle 再要求一次授權（不用使用者重選資料夾）。
export async function reconnectFolder() {
  const handle = await loadFolderHandle().catch(() => null)
  if (!handle) return false
  const permission = await handle.requestPermission({ mode: 'readwrite' })
  return permission === 'granted'
}

export async function getBackendStatus() {
  const savedHandle = await loadFolderHandle().catch(() => null)
  if (!savedHandle) return { backend: 'opfs', folderName: null, needsReconnect: false }
  const granted = await getGrantedFolderHandle()
  if (granted) return { backend: 'folder', folderName: granted.name, needsReconnect: false }
  return { backend: 'folder', folderName: savedHandle.name, needsReconnect: true }
}

async function getActiveDirectoryHandle() {
  const folderHandle = await getGrantedFolderHandle()
  if (folderHandle) return folderHandle
  return getOpfsRoot()
}

export async function writeMediaFile(fileName, blob) {
  const directory = await getActiveDirectoryHandle()
  const fileHandle = await directory.getFileHandle(fileName, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}

export async function readMediaFile(fileName) {
  if (!fileName) return null
  const directory = await getActiveDirectoryHandle()
  try {
    const fileHandle = await directory.getFileHandle(fileName)
    return await fileHandle.getFile()
  } catch {
    return null
  }
}

export async function deleteMediaFile(fileName) {
  if (!fileName) return
  const directory = await getActiveDirectoryHandle()
  try {
    await directory.removeEntry(fileName)
  } catch {
    // 檔案本來就不存在就當作已刪除
  }
}

// 選擇新資料夾／從舊格式搬家時，把目前已經存在（通常在 OPFS）的檔案複製過去，
// 使用者才不會選了資料夾之後發現圖庫變空的。
export async function copyMediaFile(fileName, fromHandle, toHandle) {
  const sourceFileHandle = await fromHandle.getFileHandle(fileName)
  const file = await sourceFileHandle.getFile()
  const targetFileHandle = await toHandle.getFileHandle(fileName, { create: true })
  const writable = await targetFileHandle.createWritable()
  await writable.write(file)
  await writable.close()
}

export async function getOpfsRootHandle() {
  return getOpfsRoot()
}
