'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  Video,
  FileText,
  BookOpen,
  X,
  Check,
} from 'lucide-react'
import type { ModuleWithLessons, CourseLesson } from '@/types'

interface LessonValues {
  title: string
  video_url: string | null
  content: string | null
}

interface Props {
  modules: ModuleWithLessons[]
  onCreateModule: (title: string) => Promise<{ error?: string }>
  onUpdateModule: (id: string, title: string) => Promise<{ error?: string }>
  onDeleteModule: (id: string) => Promise<{ error?: string }>
  onMoveModule: (id: string, direction: 'up' | 'down') => Promise<{ error?: string }>
  onCreateLesson: (moduleId: string, values: LessonValues) => Promise<{ error?: string }>
  onUpdateLesson: (id: string, values: LessonValues) => Promise<{ error?: string }>
  onDeleteLesson: (id: string) => Promise<{ error?: string }>
  onMoveLesson: (id: string, moduleId: string, direction: 'up' | 'down') => Promise<{ error?: string }>
}

function LessonForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: CourseLesson
  onSave: (values: LessonValues) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    await onSave({ title, video_url: videoUrl || null, content: content || null })
    setSaving(false)
  }

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/30">
      <Input
        placeholder="Título de la lección"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <Input
        placeholder="URL de YouTube o Vimeo (opcional)"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
      />
      <textarea
        placeholder="Contenido / descripción (opcional)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
          <Check className="h-3.5 w-3.5" />
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-3.5 w-3.5" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}

export default function CurriculumBuilder({
  modules,
  onCreateModule,
  onUpdateModule,
  onDeleteModule,
  onMoveModule,
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
  onMoveLesson,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Module form state
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingModuleTitle, setEditingModuleTitle] = useState('')

  // Lesson form state: which module is adding, which lesson is editing
  const [addingLessonToModule, setAddingLessonToModule] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)

  function refresh() {
    startTransition(() => router.refresh())
  }

  async function handleCreateModule() {
    if (!newModuleTitle.trim()) return
    const res = await onCreateModule(newModuleTitle.trim())
    if (res.error) { toast.error(res.error); return }
    setNewModuleTitle('')
    refresh()
  }

  async function handleUpdateModule(id: string) {
    if (!editingModuleTitle.trim()) return
    const res = await onUpdateModule(id, editingModuleTitle.trim())
    if (res.error) { toast.error(res.error); return }
    setEditingModuleId(null)
    refresh()
  }

  async function handleDeleteModule(id: string) {
    if (!confirm('¿Eliminar este módulo y todas sus lecciones?')) return
    const res = await onDeleteModule(id)
    if (res.error) toast.error(res.error)
    else refresh()
  }

  async function handleMoveModule(id: string, direction: 'up' | 'down') {
    await onMoveModule(id, direction)
    refresh()
  }

  async function handleCreateLesson(moduleId: string, values: LessonValues) {
    const res = await onCreateLesson(moduleId, values)
    if (res.error) { toast.error(res.error); return }
    setAddingLessonToModule(null)
    refresh()
  }

  async function handleUpdateLesson(id: string, values: LessonValues) {
    const res = await onUpdateLesson(id, values)
    if (res.error) { toast.error(res.error); return }
    setEditingLessonId(null)
    refresh()
  }

  async function handleDeleteLesson(id: string) {
    if (!confirm('¿Eliminar esta lección?')) return
    const res = await onDeleteLesson(id)
    if (res.error) toast.error(res.error)
    else refresh()
  }

  async function handleMoveLesson(id: string, moduleId: string, direction: 'up' | 'down') {
    await onMoveLesson(id, moduleId, direction)
    refresh()
  }

  return (
    <div className="space-y-4">
      {modules.length === 0 && (
        <div className="text-center py-10 border rounded-lg text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sin módulos todavía. Crea el primero abajo.</p>
        </div>
      )}

      {modules.map((mod, mIdx) => (
        <div key={mod.id} className="border rounded-lg overflow-hidden">
          {/* Module header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/40">
            {editingModuleId === mod.id ? (
              <>
                <Input
                  value={editingModuleTitle}
                  onChange={(e) => setEditingModuleTitle(e.target.value)}
                  className="h-7 text-sm flex-1"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateModule(mod.id) }}
                />
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleUpdateModule(mod.id)}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingModuleId(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <span className="font-medium text-sm flex-1">{mod.title}</span>
                <span className="text-xs text-muted-foreground mr-2">
                  {mod.course_lessons.length} lección{mod.course_lessons.length !== 1 ? 'es' : ''}
                </span>
                <Button
                  size="sm" variant="ghost" className="h-7 px-2"
                  disabled={mIdx === 0}
                  onClick={() => handleMoveModule(mod.id, 'up')}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm" variant="ghost" className="h-7 px-2"
                  disabled={mIdx === modules.length - 1}
                  onClick={() => handleMoveModule(mod.id, 'down')}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm" variant="ghost" className="h-7 px-2"
                  onClick={() => { setEditingModuleId(mod.id); setEditingModuleTitle(mod.title) }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteModule(mod.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>

          {/* Lessons */}
          <div className="divide-y">
            {mod.course_lessons.map((lesson, lIdx) => (
              <div key={lesson.id}>
                {editingLessonId === lesson.id ? (
                  <div className="p-3">
                    <LessonForm
                      initial={lesson}
                      onSave={(values) => handleUpdateLesson(lesson.id, values)}
                      onCancel={() => setEditingLessonId(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5">
                    <div className="flex gap-1 text-muted-foreground">
                      {lesson.video_url && <Video className="h-3.5 w-3.5" />}
                      {lesson.content && <FileText className="h-3.5 w-3.5" />}
                    </div>
                    <span className="text-sm flex-1">{lesson.title}</span>
                    <Button
                      size="sm" variant="ghost" className="h-7 px-2"
                      disabled={lIdx === 0}
                      onClick={() => handleMoveLesson(lesson.id, mod.id, 'up')}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-7 px-2"
                      disabled={lIdx === mod.course_lessons.length - 1}
                      onClick={() => handleMoveLesson(lesson.id, mod.id, 'down')}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-7 px-2"
                      onClick={() => setEditingLessonId(lesson.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteLesson(lesson.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {/* Add lesson form or button */}
            {addingLessonToModule === mod.id ? (
              <div className="p-3">
                <LessonForm
                  onSave={(values) => handleCreateLesson(mod.id, values)}
                  onCancel={() => setAddingLessonToModule(null)}
                />
              </div>
            ) : (
              <div className="px-4 py-2">
                <Button
                  size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
                  onClick={() => setAddingLessonToModule(mod.id)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar lección
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add module */}
      <div className="flex gap-2">
        <Input
          placeholder="Título del nuevo módulo…"
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreateModule() }}
        />
        <Button onClick={handleCreateModule} disabled={!newModuleTitle.trim() || isPending}>
          <Plus className="h-4 w-4" />
          Módulo
        </Button>
      </div>
    </div>
  )
}
