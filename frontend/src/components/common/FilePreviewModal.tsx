import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Image, File, Video, Music } from 'lucide-react'

interface PreviewFile {
  name: string
  url: string
}

interface FilePreviewModalProps {
  files: PreviewFile[]
  initialIndex?: number
  onClose: () => void
}

type FileType = 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'other'

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif', 'avif']
const VIDEO_EXTS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v', '3gp']
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma', 'opus']
const PDF_EXTS = ['pdf']
const DOC_EXTS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf']

function extractExt(source: string): string {
  const pathPart = source.split('?')[0]
  const lastDot = pathPart.lastIndexOf('.')
  if (lastDot === -1) return ''
  return pathPart.substring(lastDot + 1).toLowerCase()
}

function getFileType(url: string, name?: string): FileType {
  const nameExt = name ? extractExt(name) : ''
  if (nameExt) {
    if (IMAGE_EXTS.includes(nameExt)) return 'image'
    if (VIDEO_EXTS.includes(nameExt)) return 'video'
    if (AUDIO_EXTS.includes(nameExt)) return 'audio'
    if (PDF_EXTS.includes(nameExt)) return 'pdf'
    if (DOC_EXTS.includes(nameExt)) return 'doc'
  }

  const urlExt = extractExt(url)
  if (urlExt) {
    if (IMAGE_EXTS.includes(urlExt)) return 'image'
    if (VIDEO_EXTS.includes(urlExt)) return 'video'
    if (AUDIO_EXTS.includes(urlExt)) return 'audio'
    if (PDF_EXTS.includes(urlExt)) return 'pdf'
    if (DOC_EXTS.includes(urlExt)) return 'doc'
  }

  return 'other'
}

function getFileTypeIcon(fileType: FileType) {
  switch (fileType) {
    case 'image': return <Image className="w-4 h-4 text-blue-400 shrink-0" />
    case 'video': return <Video className="w-4 h-4 text-purple-400 shrink-0" />
    case 'audio': return <Music className="w-4 h-4 text-emerald-400 shrink-0" />
    case 'pdf': return <FileText className="w-4 h-4 text-red-400 shrink-0" />
    case 'doc': return <FileText className="w-4 h-4 text-blue-400 shrink-0" />
    default: return <File className="w-4 h-4 text-slate-400 shrink-0" />
  }
}

function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url
  if (url.startsWith('/')) return `${window.location.origin}${url}`
  return url
}

function toProxyUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('blob:') || url.startsWith('data:')) return url
  if (url.includes('/api/upload/serve')) return url

  let filePath = ''

  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      if (pathname.startsWith('/api/files/')) {
        filePath = pathname.substring('/api/files/'.length)
      } else {
        filePath = pathname.startsWith('/') ? pathname.substring(1) : pathname
      }
    } else if (url.startsWith('/api/files/')) {
      filePath = url.substring('/api/files/'.length)
    } else if (url.startsWith('/')) {
      filePath = url.substring(1)
    } else {
      filePath = url
    }
  } catch {
    filePath = url
  }

  if (!filePath) return url

  return `/api/upload/serve?path=${encodeURIComponent(filePath)}`
}

function getDocPreviewUrl(url: string): string | null {
  const ext = extractExt(url)
  const supportedExts = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
  if (!supportedExts.includes(ext)) return null
  const proxyUrl = toProxyUrl(url)
  const absoluteUrl = toAbsoluteUrl(proxyUrl)
  const encodedUrl = encodeURIComponent(absoluteUrl)
  return `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`
}

function FilePreviewModalContent({ files, initialIndex = 0, onClose }: FilePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(true)

  const currentFile = files[currentIndex]
  const fileType = currentFile ? getFileType(currentFile.url, currentFile.name) : 'other'

  const goNext = useCallback(() => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setZoom(1)
      setLoading(true)
    }
  }, [currentIndex, files.length])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setZoom(1)
      setLoading(true)
    }
  }, [currentIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goNext, goPrev])

  useEffect(() => {
    setCurrentIndex(initialIndex)
    setZoom(1)
    setLoading(true)
  }, [initialIndex])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!currentFile) return null

  const docPreviewUrl = fileType === 'doc' ? getDocPreviewUrl(currentFile.url) : null
  const proxyUrl = toProxyUrl(currentFile.url)
  const originalUrl = toAbsoluteUrl(currentFile.url)

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = proxyUrl
    a.download = currentFile.name || 'download'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full h-full flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {getFileTypeIcon(fileType)}
            <span className="text-white text-sm font-medium truncate">{currentFile.name || '预览文件'}</span>
            {files.length > 1 && (
              <span className="text-white/50 text-xs shrink-0">{currentIndex + 1} / {files.length}</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {fileType === 'image' && (
              <>
                <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-white/50 text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(4, z + 0.25))}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={handleDownload}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="下载">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center overflow-auto relative">
          {/* Image */}
          {fileType === 'image' && (
            <div className="flex items-center justify-center w-full h-full p-4">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <img
                src={proxyUrl}
                alt={currentFile.name}
                style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
                className="max-w-full max-h-full object-contain"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </div>
          )}

          {/* Video */}
          {fileType === 'video' && (
            <div className="flex items-center justify-center w-full h-full p-4">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <video
                src={proxyUrl}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-lg shadow-2xl"
                onLoadedData={() => setLoading(false)}
                onError={() => setLoading(false)}
              >
                您的浏览器不支持视频播放
              </video>
            </div>
          )}

          {/* Audio */}
          {fileType === 'audio' && (
            <div className="flex flex-col items-center justify-center gap-6 p-8">
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 rounded-3xl flex items-center justify-center border border-emerald-500/20 shadow-2xl">
                <Music className="w-16 h-16 text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-white/80 text-lg font-semibold mb-1">{currentFile.name || '音频文件'}</p>
                <p className="text-white/40 text-sm">正在播放</p>
              </div>
              <audio
                src={proxyUrl}
                controls
                autoPlay
                className="w-full max-w-lg"
                onLoadedData={() => setLoading(false)}
                onError={() => setLoading(false)}
              >
                您的浏览器不支持音频播放
              </audio>
            </div>
          )}

          {/* PDF */}
          {fileType === 'pdf' && (
            <iframe
              src={proxyUrl}
              className="w-full h-full bg-white"
              title={currentFile.name}
              onLoad={() => setLoading(false)}
            />
          )}

          {/* Office Doc (Word/Excel/PPT) */}
          {fileType === 'doc' && docPreviewUrl && (
            <iframe
              src={docPreviewUrl}
              className="w-full h-full bg-white"
              title={currentFile.name}
              onLoad={() => setLoading(false)}
            />
          )}

          {/* Doc without preview URL */}
          {fileType === 'doc' && !docPreviewUrl && (
            <div className="flex flex-col items-center justify-center gap-6 p-8">
              <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center">
                <FileText className="w-12 h-12 text-blue-400/60" />
              </div>
              <div className="text-center">
                <p className="text-white/80 text-lg font-semibold mb-1">{currentFile.name || '文档'}</p>
                <p className="text-white/40 text-sm">该文档类型暂不支持在线预览</p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors shadow-lg"
              >
                <Download className="w-4 h-4" />
                下载文件
              </button>
            </div>
          )}

          {/* Other unsupported */}
          {fileType === 'other' && (
            <div className="flex flex-col items-center justify-center gap-6 p-8">
              <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center">
                <File className="w-12 h-12 text-white/40" />
              </div>
              <div className="text-center">
                <p className="text-white/80 text-lg font-semibold mb-1">{currentFile.name || '文件'}</p>
                <p className="text-white/40 text-sm">该文件类型不支持在线预览</p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors shadow-lg"
              >
                <Download className="w-4 h-4" />
                下载文件
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {files.length > 1 && (
          <>
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white/60 hover:text-white rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              disabled={currentIndex === files.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white/60 hover:text-white rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function FilePreviewModal(props: FilePreviewModalProps) {
  return createPortal(<FilePreviewModalContent {...props} />, document.body)
}

interface FileLinkProps {
  name: string
  url: string
  files?: PreviewFile[]
  className?: string
  icon?: React.ReactNode
  children?: React.ReactNode
  title?: string
}

export function FileLink({ name, url, files, className, icon, children, title }: FileLinkProps) {
  const [previewOpen, setPreviewOpen] = useState(false)

  const allFiles: PreviewFile[] = files || [{ name, url }]

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPreviewOpen(true)
  }

  return (
    <>
      <a
        href={url}
        onClick={handleClick}
        className={className}
        title={title}
        rel="noopener noreferrer"
      >
        {children || (
          <>
            {icon}
            <span className="truncate">{name}</span>
          </>
        )}
      </a>
      {previewOpen && (
        <FilePreviewModal
          files={allFiles}
          initialIndex={allFiles.findIndex(f => f.url === url) || 0}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  )
}

interface FileLinksProps {
  files: PreviewFile[]
  className?: string
  icon?: React.ReactNode
}

export function FileLinks({ files, className, icon }: FileLinksProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  if (!files || files.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => (
          <a
            key={i}
            href={f.url}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setPreviewIndex(i)
              setPreviewOpen(true)
            }}
            className={className || "flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors"}
            rel="noopener noreferrer"
          >
            {icon || <FileText className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{f.name}</span>
          </a>
        ))}
      </div>
      {previewOpen && (
        <FilePreviewModal
          files={files}
          initialIndex={previewIndex}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  )
}
