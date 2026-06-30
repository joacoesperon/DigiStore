import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment cancelled</h1>
        <p className="text-muted-foreground mb-6">
          Your payment was cancelled. No charges were made.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/products">Back to products</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
