import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CurriculumBuilder from '@/components/admin/CurriculumBuilder'
import type { ModuleWithLessons } from '@/types'

export default async function CurriculumPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: productId } = await params
  const supabase = createServiceClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, name, type')
    .eq('id', productId)
    .single()

  if (!product || product.type !== 'course') notFound()

  const { data: modulesRaw } = await supabase
    .from('course_modules')
    .select('*, course_lessons(*)')
    .eq('product_id', productId)
    .order('position', { ascending: true })

  const modules = ((modulesRaw ?? []) as ModuleWithLessons[]).map((m) => ({
    ...m,
    course_lessons: [...m.course_lessons].sort((a, b) => a.position - b.position),
  }))

  // ─── Module server actions ──────────────────────────────────────────────────

  async function createModule(title: string): Promise<{ error?: string }> {
    'use server'
    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('course_modules')
      .select('position')
      .eq('product_id', productId)
      .order('position', { ascending: false })
      .limit(1)
    const nextPos = (existing?.[0]?.position ?? -1) + 1
    const { error } = await admin
      .from('course_modules')
      .insert({ product_id: productId, title: title.trim(), position: nextPos })
    return { error: error?.message }
  }

  async function updateModule(id: string, title: string): Promise<{ error?: string }> {
    'use server'
    const { error } = await createAdminClient()
      .from('course_modules')
      .update({ title: title.trim() })
      .eq('id', id)
      .eq('product_id', productId)
    return { error: error?.message }
  }

  async function deleteModule(id: string): Promise<{ error?: string }> {
    'use server'
    const { error } = await createAdminClient()
      .from('course_modules')
      .delete()
      .eq('id', id)
      .eq('product_id', productId)
    return { error: error?.message }
  }

  async function moveModule(id: string, direction: 'up' | 'down'): Promise<{ error?: string }> {
    'use server'
    const admin = createAdminClient()
    const { data: mods } = await admin
      .from('course_modules')
      .select('id, position')
      .eq('product_id', productId)
      .order('position', { ascending: true })
    if (!mods) return {}
    const idx = mods.findIndex((m) => m.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= mods.length) return {}
    await admin.from('course_modules').update({ position: mods[swapIdx].position }).eq('id', mods[idx].id)
    await admin.from('course_modules').update({ position: mods[idx].position }).eq('id', mods[swapIdx].id)
    return {}
  }

  // ─── Lesson server actions ──────────────────────────────────────────────────

  interface LessonValues {
    title: string
    video_url: string | null
    content: string | null
    file_path: string | null
  }

  async function createLesson(moduleId: string, values: LessonValues): Promise<{ error?: string }> {
    'use server'
    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('course_lessons')
      .select('position')
      .eq('module_id', moduleId)
      .order('position', { ascending: false })
      .limit(1)
    const nextPos = (existing?.[0]?.position ?? -1) + 1
    const { error } = await admin.from('course_lessons').insert({
      module_id: moduleId,
      product_id: productId,
      title: values.title.trim(),
      video_url: values.video_url || null,
      content: values.content || null,
      file_path: values.file_path || null,
      position: nextPos,
    })
    return { error: error?.message }
  }

  async function updateLesson(id: string, values: LessonValues): Promise<{ error?: string }> {
    'use server'
    const { error } = await createAdminClient()
      .from('course_lessons')
      .update({
        title: values.title.trim(),
        video_url: values.video_url || null,
        content: values.content || null,
        file_path: values.file_path || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('product_id', productId)
    return { error: error?.message }
  }

  async function deleteLesson(id: string): Promise<{ error?: string }> {
    'use server'
    const admin = createAdminClient()
    // Clean up storage file if one exists
    const { data: lesson } = await admin
      .from('course_lessons')
      .select('file_path')
      .eq('id', id)
      .eq('product_id', productId)
      .single()
    if (lesson?.file_path) {
      const svc = createServiceClient()
      await svc.storage.from('product-files').remove([lesson.file_path])
    }
    const { error } = await admin
      .from('course_lessons')
      .delete()
      .eq('id', id)
      .eq('product_id', productId)
    return { error: error?.message }
  }

  async function moveLesson(
    id: string,
    moduleId: string,
    direction: 'up' | 'down'
  ): Promise<{ error?: string }> {
    'use server'
    const admin = createAdminClient()
    const { data: lessons } = await admin
      .from('course_lessons')
      .select('id, position')
      .eq('module_id', moduleId)
      .order('position', { ascending: true })
    if (!lessons) return {}
    const idx = lessons.findIndex((l) => l.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= lessons.length) return {}
    await admin.from('course_lessons').update({ position: lessons[swapIdx].position }).eq('id', lessons[idx].id)
    await admin.from('course_lessons').update({ position: lessons[idx].position }).eq('id', lessons[swapIdx].id)
    return {}
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a productos
        </Link>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">Curriculum — módulos y lecciones</p>
      </div>

      <CurriculumBuilder
        modules={modules}
        onCreateModule={createModule}
        onUpdateModule={updateModule}
        onDeleteModule={deleteModule}
        onMoveModule={moveModule}
        onCreateLesson={createLesson}
        onUpdateLesson={updateLesson}
        onDeleteLesson={deleteLesson}
        onMoveLesson={moveLesson}
      />
    </div>
  )
}
