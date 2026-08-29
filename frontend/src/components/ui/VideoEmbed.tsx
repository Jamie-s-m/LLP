interface VideoEmbedProps {
  url: string
  title?: string
}

const getEmbedUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = parsed.pathname === '/watch' ? parsed.searchParams.get('v') : parsed.pathname.split('/').pop()
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    if (host === 'youtu.be') {
      const videoId = parsed.pathname.slice(1)
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    if (host === 'vimeo.com') {
      const videoId = parsed.pathname.split('/').filter(Boolean).pop()
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null
    }
    if (host === 'player.vimeo.com') {
      return url
    }
    return null
  } catch {
    return null
  }
}

export default function VideoEmbed({ url, title }: VideoEmbedProps) {
  if (!url) return null
  const embedUrl = getEmbedUrl(url)

  if (embedUrl) {
    return (
      <div className="mb-6 aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          src={embedUrl}
          title={title || 'Lesson video'}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  // Not a recognized YouTube/Vimeo link — fall back to treating it as a direct media file URL.
  return (
    <video controls className="mb-6 w-full rounded-2xl bg-black" src={url}>
      Your browser does not support embedded video.
    </video>
  )
}
