'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

export default function CreateCouponDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    max_uses: '',
    expires_at: '',
  })

  async function handleCreate() {
    if (!form.code || !form.value) {
      toast.error('Code and value are required')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('coupons').insert({
      code: form.code.toUpperCase(),
      type: form.type as 'percentage' | 'fixed',
      value: Number(form.value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      is_active: true,
    })

    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Coupon created')
    setOpen(false)
    setForm({ code: '', type: 'percentage', value: '', max_uses: '', expires_at: '' })
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          New coupon
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Coupon</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Code</Label>
            <Input
              placeholder="SUMMER20"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                min={1}
                placeholder={form.type === 'percentage' ? '20' : '500'}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Max uses (optional)</Label>
              <Input
                type="number"
                min={1}
                placeholder="100"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Expires at (optional)</Label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create coupon'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
