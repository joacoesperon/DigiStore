/**
 * Converts a YouTube or Vimeo watch URL to an embeddable iframe src.
 * Returns null if the URL is not recognized.
 *
 * Supported formats:
 *   https://youtube.com/watch?v=ID
 *   https://www.youtube.com/watch?v=ID
 *   https://youtu.be/ID
 *   https://vimeo.com/ID
 */
export function getEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null

  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`

  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`

  return null
}
