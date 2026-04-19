import { useState } from 'react'
import { API_URL } from '../config/api'
import { useTranslation } from 'react-i18next'
import { useMessage } from './useMessage'

export function useImageUpload() {
  const { t } = useTranslation()
  const { error } = useMessage()
  const [uploading, setUploading] = useState(false)

  const uploadImages = async (files: FileList | File[]): Promise<string[]> => {
    setUploading(true)
    const token = localStorage.getItem('token')
    const urls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])
        
        const res = await fetch(`${API_URL.BASE}/api/upload/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })
        
        const data = await res.json()
        if (data.fileUrl || data.url || (data.data && data.data.url)) {
          urls.push(data.fileUrl || data.url || data.data.url)
        } else {
          throw new Error(data.message || 'Upload failed')
        }
      }
      return urls
    } catch (err: any) {
      error(t('api.upload_failed') + ': ' + err.message)
      return []
    } finally {
      setUploading(false)
    }
  }

  return {
    uploadImages,
    uploading
  }
}
