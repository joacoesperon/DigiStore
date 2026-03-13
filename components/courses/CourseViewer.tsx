'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import { getEmbedUrl } from '@/lib/utils/course'
import type { ModuleWithLessons, CourseLesson } from '@/types'

interface Props {
  productId: string
  productName: string
  modules: ModuleWithLessons[]
  completedLessonIds: string[]
  currentLessonId: string
}

export default function CourseViewer({
  productId,
  productName,
  modules,
  completedLessonIds: initialCompleted,
  currentLessonId,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [completed, setCompleted] = useState<Set<string>>(new Set(initialCompleted))
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const allLessons = modules.flatMap((m) => m.course_lessons)
  const currentIdx = allLessons.findIndex((l) => l.id === currentLessonId)
  const currentLesson: CourseLesson | undefined = allLessons[currentIdx]
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null
  const isCompleted = completed.has(currentLessonId)

  function navigate(lessonId: string) {
    startTransition(() => {
      router.push(`/dashboard/courses/${productId}?lesson=${lessonId}`)
    })
  }

  async function toggleComplete() {
    const newValue = !isCompleted
    // Optimistic update
    setCompleted((prev) => {
      const next = new Set(prev)
      if (newValue) next.add(currentLessonId)
      else next.delete(currentLessonId)
      return next
    })

    try {
      const res = await fetch(`/api/courses/${productId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: currentLessonId, completed: newValue }),
      })
      if (!res.ok) throw new Error()

      // Auto-advance on mark complete (if there's a next lesson)
      if (newValue && nextLesson) {
        navigate(nextLesson.id)
      } else {
        router.refresh()
      }
    } catch {
      // Revert optimistic update on error
      setCompleted((prev) => {
        const next = new Set(prev)
        if (newValue) next.delete(currentLessonId)
        else next.add(currentLessonId)
        return next
      })
      toast.error('Error al guardar el progreso')
    }
  }

  const embedUrl = getEmbedUrl(currentLesson?.video_url)
  const totalLessons = allLessons.length
  const completedCount = completed.size
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -my-8">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 border-r bg-background overflow-y-auto transition-all duration-200 ${
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm leading-tight mb-3">{productName}</h2>
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedCount}/{totalLessons} lecciones</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Module / lesson list */}
        <nav className="py-2">
          {modules.map((mod) => (
            <div key={mod.id}>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {mod.title}
              </div>
              {mod.course_lessons.map((lesson) => {
                const done = completed.has(lesson.id)
                const active = lesson.id === currentLessonId
                return (
                  <button
                    key={lesson.id}
                    onClick={() => navigate(lesson.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    ) : (
                      <Circle className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                    <span className="leading-tight">{lesson.title}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
          {/* Top bar */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <h1 className="text-xl font-bold leading-tight">{currentLesson?.title}</h1>
          </div>

          {/* Video embed */}
          {embedUrl && (
            <div className="aspect-video w-full rounded-lg overflow-hidden border bg-black">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Text content */}
          {currentLesson?.content && (
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {currentLesson.content}
            </div>
          )}

          {!embedUrl && !currentLesson?.content && (
            <p className="text-muted-foreground text-sm">Esta lección no tiene contenido todavía.</p>
          )}

          {/* Navigation + mark complete */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={!prevLesson || isPending}
              onClick={() => prevLesson && navigate(prevLesson.id)}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <Button
              variant={isCompleted ? 'outline' : 'default'}
              size="sm"
              onClick={toggleComplete}
              className="gap-2"
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Completada
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4" />
                  Marcar como completada
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!nextLesson || isPending}
              onClick={() => nextLesson && navigate(nextLesson.id)}
              className="gap-2"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
