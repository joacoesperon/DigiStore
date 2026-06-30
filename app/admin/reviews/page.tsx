import { createServiceClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils/formatters'
import type { Review, Product } from '@/types'
import ApproveReviewButton from '@/components/admin/ApproveReviewButton'
import DeleteReviewButton from '@/components/admin/DeleteReviewButton'
import { Star } from 'lucide-react'

type ReviewWithProduct = Review & {
  products: Pick<Product, 'id' | 'name'>
}

export default async function AdminReviewsPage() {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('reviews')
    .select('*, products(id, name)')
    .order('created_at', { ascending: false })

  const reviews = (data ?? []) as ReviewWithProduct[]

  const pending = reviews.filter((r) => !r.is_approved)
  const approved = reviews.filter((r) => r.is_approved)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Moderate customer reviews</p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            Pending approval
            <Badge variant="secondary">{pending.length}</Badge>
          </h2>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="text-sm font-medium">{review.products.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{review.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      {review.title && <p className="text-sm font-medium">{review.title}</p>}
                      {review.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{review.body}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(review.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ApproveReviewButton reviewId={review.id} />
                        <DeleteReviewButton reviewId={review.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Approved */}
      <div>
        <h2 className="text-base font-semibold mb-3">
          Approved ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">No approved reviews yet.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {approved.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="text-sm font-medium">{review.products.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{review.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      {review.title && <p className="text-sm font-medium">{review.title}</p>}
                      {review.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{review.body}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(review.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteReviewButton reviewId={review.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
