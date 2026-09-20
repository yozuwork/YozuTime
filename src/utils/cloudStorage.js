// 雲端同步先留一個固定介面；本機新增（imageStorage.js）永遠是預設、離線可用的路徑，
// 雲端上傳是使用者對單張圖片另外觸發的動作。等 Firebase 設定到位後，只要換掉這裡的實作即可，
// 呼叫端（usePomodoroGallery）不需要跟著改。
export const CLOUD_CONFIGURED = false

export async function uploadImageToCloud() {
  throw new Error('尚未設定雲端連線，圖片已保留在本機')
}
