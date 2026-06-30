'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { profileSchema, changePasswordSchema } from '@/lib/utils/validators'
import type { ChangePasswordFormValues } from '@/lib/utils/validators'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Chrome } from 'lucide-react'

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [hasEmailIdentity, setHasEmailIdentity] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  })

  const {
    register: registerPwd,
    handleSubmit: handleSubmitPwd,
    reset: resetPwd,
    setError: setPwdError,
    formState: { errors: pwdErrors, isSubmitting: isPwdSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? '')
      setHasEmailIdentity(
        user.identities?.some((i) => i.provider === 'email') ?? false
      )

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        reset({ full_name: profile.full_name ?? '' })
      }
      setLoading(false)
    }
    load()
  }, [reset])

  async function onSubmit(values: ProfileFormValues) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: values.full_name })
      .eq('id', user.id)

    if (error) {
      toast.error('Failed to update profile')
      return
    }

    toast.success('Profile updated')
    router.refresh()
  }

  async function onChangePassword(values: ChangePasswordFormValues) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return

    // Verificar contraseña actual antes de permitir el cambio
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: values.currentPassword,
    })

    if (signInError) {
      setPwdError('currentPassword', { message: 'Incorrect password' })
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: values.newPassword,
    })

    if (updateError) {
      toast.error(updateError.message)
      return
    }

    toast.success('Password updated successfully')
    resetPwd()
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update your account information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 mb-4">
            <Label className="text-muted-foreground">Email</Label>
            <p className="text-sm">{email}</p>
          </div>
          <Separator />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Info</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" placeholder="Your name" {...register('full_name')} />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sección de contraseña — solo para usuarios con email/password */}
      {hasEmailIdentity ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
            <CardDescription>
              Enter your current password to set a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPwd(onChangePassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...registerPwd('currentPassword')}
                />
                {pwdErrors.currentPassword && (
                  <p className="text-xs text-destructive">{pwdErrors.currentPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...registerPwd('newPassword')}
                />
                {pwdErrors.newPassword && (
                  <p className="text-xs text-destructive">{pwdErrors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...registerPwd('confirmPassword')}
                />
                {pwdErrors.confirmPassword && (
                  <p className="text-xs text-destructive">{pwdErrors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isPwdSubmitting}>
                {isPwdSubmitting ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Password</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Chrome className="h-4 w-4 shrink-0" />
              <p>
                Your account uses Google Sign-In. Password management is handled by Google.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
