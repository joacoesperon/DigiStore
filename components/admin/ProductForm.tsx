'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { productSchema, type ProductFormValues } from '@/lib/utils/validators'
import { toSlug } from '@/lib/utils/formatters'
import type { Product } from '@/types'
import FileUpload from './FileUpload'

interface ProductFormProps {
  product?: Product
  onSubmit: (values: ProductFormValues, filePath: string | null) => Promise<{ error?: string }>
}

export default function ProductForm({ product, onSubmit }: ProductFormProps) {
  const router = useRouter()
  const [filePath, setFilePath] = useState<string | null>(product?.file_path ?? null)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      description: product?.description ?? '',
      short_description: product?.short_description ?? '',
      type: product?.type ?? 'software',
      status: product?.status ?? 'draft',
      thumbnail_url: product?.thumbnail_url ?? '',
    },
  })

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    form.setValue('name', e.target.value)
    if (!product) {
      form.setValue('slug', toSlug(e.target.value))
    }
  }

  async function handleSubmit(values: ProductFormValues) {
    const result = await onSubmit(values, filePath)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(product ? 'Producto actualizado' : 'Producto creado')
    router.push('/admin/products')
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Mi Producto"
                    {...field}
                    onChange={handleNameChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Slug */}
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug (URL)</FormLabel>
                <FormControl>
                  <Input placeholder="mi-producto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="ebook">Ebook</SelectItem>
                    <SelectItem value="course">Curso</SelectItem>
                    <SelectItem value="template">Plantilla</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Thumbnail URL */}
        <FormField
          control={form.control}
          name="thumbnail_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de miniatura (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://..."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Short description */}
        <FormField
          control={form.control}
          name="short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción corta (máx. 280 caracteres)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Una frase que describe el producto..."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción completa</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el producto en detalle..."
                  rows={6}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Downloadable file */}
        <div className="space-y-2">
          <Separator />
          <div>
            <p className="text-sm font-medium">Archivo descargable</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              El archivo que recibirán los compradores del producto (PDF, ZIP, PY, EX4/EX5…).
              El archivo es privado — solo usuarios con una licencia activa pueden descargarlo.
            </p>
          </div>
          {product?.id ? (
            <FileUpload
              productId={product.id}
              currentFilePath={filePath}
              onUploadComplete={setFilePath}
              onRemove={() => setFilePath(null)}
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Primero guarda el producto para poder subir el archivo.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? 'Guardando…'
              : product
              ? 'Guardar cambios'
              : 'Crear producto'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
