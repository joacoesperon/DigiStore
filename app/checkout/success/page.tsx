import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment successful!</h1>
        <p className="text-muted-foreground mb-6">
          Your license has been generated and is now active in your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/dashboard/licenses">View my licenses</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">Browse more products</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
