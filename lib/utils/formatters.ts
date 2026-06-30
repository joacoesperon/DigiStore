/**
 * Formatea un entero en centavos a string de moneda legible.
 * Ej: 4999 → "$49.99"
 */
export function formatCurrency(
  cents: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

/**
 * Formatea una fecha ISO a string legible.
 * Ej: "2025-03-06T12:00:00Z" → "Mar 6, 2025"
 */
export function formatDate(date: string | Date | null, locale = 'en-US'): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Formatea fecha con hora.
 */
export function formatDateTime(date: string | Date | null, locale = 'en-US'): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Convierte dólares (string o number) a centavos.
 * Ej: "49.99" → 4999
 */
export function dollarsToCents(dollars: number | string): number {
  return Math.round(Number(dollars) * 100)
}

/**
 * Convierte centavos a dólares.
 * Ej: 4999 → 49.99
 */
export function centsToDollars(cents: number): number {
  return cents / 100
}

/**
 * Formatea bytes a string legible.
 * Ej: formatFileSize(1048576) → "1 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Genera un slug URL a partir de un string.
 * Ej: toSlug("Mi Producto Genial") → "mi-producto-genial"
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
