import { useEffect, useState } from 'react'
import { readMediaBlob } from '../../utils/imageStorage.js'

// GIF 靠 <img> 原生循環播放；MP4 等影片改用 <video> 靜音自動播放並循環，兩者共用同一組圖庫資料。
// 圖片實際內容現在存在本機資料夾／OPFS，要非同步讀取後才能組出可用的 src，
// 讀完要記得 revoke 掉 objectURL，不然每次換圖都會漏記憶體。
function MediaPreview({ image, alt, loading }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    if (!image) {
      setSrc('')
      return
    }

    // 舊資料還留著 dataUrl，本身就是完整的 src，不需要再組 objectURL。
    if (image.dataUrl) {
      setSrc(image.dataUrl)
      return
    }

    let cancelled = false
    let objectUrl = ''
    setSrc('')

    readMediaBlob(image).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setSrc(objectUrl)
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [image?.id, image?.fileName, image?.dataUrl])

  if (!src) return null

  if (image?.mediaType === 'video') {
    return <video src={src} autoPlay loop muted playsInline disablePictureInPicture />
  }

  return <img src={src} alt={alt} loading={loading} />
}

export default MediaPreview
