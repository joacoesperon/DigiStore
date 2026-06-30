'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  productId: string
  currentFilePath: string | null
  onUploadComplete: (filePath: string) => void
  onRemove: () => void
}

function getFileName(filePath: string) {
  return filePath.split('/').pop() ?? filePath
}

export default function FileUpload({
  productId,
  currentFilePath,
  onUploadComplete,
  onRemove,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file: File) {
    if (!file) return
    const MAX_MB = 200
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large. Max size is ${MAX_MB} MB.`)
      return
    }

    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('productId', productId)
    if (currentFilePath) formData.append('currentFilePath', currentFilePath)

    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const json = await res.json()
    setUploading(false)

    if (!res.ok) {
      toast.error(`Upload failed: ${json.error ?? res.statusText}`)
      return
    }

    toast.success('File uploaded')
    onUploadComplete(json.path)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  async function handleDownload() {
    if (!currentFilePath) return
    setDownloading(true)
    const res = await fetch(`/api/admin/upload?filePath=${encodeURIComponent(currentFilePath)}`)
    const json = await res.json()
    setDownloading(false)
    if (!res.ok) {
      toast.error(`Download failed: ${json.error ?? res.statusText}`)
      return
    }
    const a = document.createElement('a')
    a.href = json.url
    a.download = getFileName(currentFilePath)
    a.click()
  }

  async function handleRemove() {
    if (!currentFilePath) return
    await fetch('/api/admin/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: currentFilePath }),
    })
    onRemove()
    toast.success('File removed')
  }

  if (currentFilePath) {
    return (
      <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
        <span className="text-sm flex-1 truncate">{getFileName(currentFilePath)}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="text-xs gap-1"
        >
          <Download className="h-3.5 w-3.5" />
          {downloading ? 'Downloading…' : 'Download'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs gap-1"
        >
          <Upload className="h-3.5 w-3.5" />
          Replace
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-destructive hover:text-destructive text-xs gap-1"
        >
          <X className="h-3.5 w-3.5" />
          Remove
        </Button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleInputChange} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed transition-colors cursor-pointer',
        dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">
            {uploading ? 'Uploading…' : 'Click or drag to upload'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            PDF, ZIP, PY, EX4, EX5, and more — up to 200 MB
          </p>
        </div>
        {uploading && (
          <div className="w-24 h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary animate-pulse w-full" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleInputChange}
        accept=".pdf,.zip,.py,.mq5,.ex4,.ex5,.exe,.dmg,.pkg,.tar,.gz,.rar,.7z,.mp4,.mp3,.epub,.mobi"
      />
    </div>
  )
}
