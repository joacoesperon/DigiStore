'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface LicenseKeyDisplayProps {
  licenseKey: string
  status: string
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-700 bg-green-50 border-green-200',
  trial: 'text-blue-700 bg-blue-50 border-blue-200',
  expired: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  revoked: 'text-red-700 bg-red-50 border-red-200',
  suspended: 'text-orange-700 bg-orange-50 border-orange-200',
}

export default function LicenseKeyDisplay({ licenseKey, status }: LicenseKeyDisplayProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(licenseKey)
    setCopied(true)
    toast.success('License key copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <code className="font-mono text-sm font-semibold tracking-widest truncate">
            {licenseKey}
          </code>
          <Badge
            variant="outline"
            className={`shrink-0 capitalize text-xs ${STATUS_COLORS[status] ?? ''}`}
          >
            {status}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
