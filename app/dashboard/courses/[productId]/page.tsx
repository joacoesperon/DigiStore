import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import CourseViewer from '@/components/courses/CourseViewer'
import type { ModuleWithLessons } from '@/types'

export default async function CourseViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>
  searchParams: Promise<{ lesson?: string }>
}) {
  const { productId } = await params
  const { lesson: lessonParam } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = createServiceClient()

  // Validate: product exists and is a course
  const { data: product } = await serviceClient
    .from('products')
    .select('id, name, type')
    .eq('id', productId)
    .eq('type', 'course')
    .single()

  if (!product) notFound()

  // Validate: user has active license for this product
  const { data: license } = await serviceClient
    .from('licenses')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .in('status', ['active', 'trial'])
    .limit(1)
    .single()

  if (!license) redirect('/dashboard/licenses')

  // Fetch modules with lessons ordered by position
  const { data: modulesRaw } = await serviceClient
    .from('course_modules')
    .select('*, course_lessons(*)')
    .eq('product_id', productId)
    .order('position', { ascending: true })

  const modules = ((modulesRaw ?? []) as ModuleWithLessons[]).map((m) => ({
    ...m,
    course_lessons: [...m.course_lessons].sort((a, b) => a.position - b.position),
  }))

  // All lessons as a flat list
  const allLessons = modules.flatMap((m) => m.course_lessons)

  if (allLessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-2">
        <p className="text-lg font-medium">{product.name}</p>
        <p className="text-sm">Este curso no tiene contenido todavía.</p>
      </div>
    )
  }

  // Fetch user's progress for this product
  const { data: progressRows } = await serviceClient
    .from('course_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
    .eq('product_id', productId)

  const completedLessonIds = (progressRows ?? []).map((r) => r.lesson_id)

  // Determine which lesson to show
  let currentLessonId = lessonParam ?? ''
  const isValid = allLessons.some((l) => l.id === currentLessonId)
  if (!isValid) {
    // Select first incomplete lesson, or first lesson if all complete
    const firstIncomplete = allLessons.find((l) => !completedLessonIds.includes(l.id))
    currentLessonId = firstIncomplete?.id ?? allLessons[0].id
  }

  return (
    <CourseViewer
      productId={productId}
      productName={product.name}
      modules={modules}
      completedLessonIds={completedLessonIds}
      currentLessonId={currentLessonId}
    />
  )
}
