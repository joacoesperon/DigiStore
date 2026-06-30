'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { reviewSchema, type ReviewFormValues } from '@/lib/utils/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star } from 'lucide-react'

export default function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({ resolver: zodResolver(reviewSchema) })

  function pick(n: number) {
    setRating(n)
    setValue('rating', n, { shouldValidate: true })
  }

  async function onSubmit(values: ReviewFormValues) {
    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data.error ?? 'Could not submit review')
      return
    }
    toast.success('Review submitted for approval')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => pick(n)} aria-label={`${n} stars`}>
            <Star
              className={`h-6 w-6 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
            />
          </button>
        ))}
      </div>
      {errors.rating && <p className="text-sm text-destructive">Select a rating</p>}
      <input type="hidden" {...register('rating', { valueAsNumber: true })} />
      <div className="space-y-2">
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input id="review-title" {...register('title')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="review-body">Review (optional)</Label>
        <Textarea id="review-body" rows={4} {...register('body')} />
      </div>
      <Button type="submit" disabled={isSubmitting || rating === 0}>
        {isSubmitting ? 'Submitting...' : 'Submit review'}
      </Button>
    </form>
  )
}
