'use client'

import { createClient } from '@/lib/supabase/client'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function HeaderSignOut() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <DropdownMenuItem
      onClick={handleSignOut}
      className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </DropdownMenuItem>
  )
}
