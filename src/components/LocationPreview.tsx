import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from '../i18n/context'

export default function LocationPreview({ address }: { address: string }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const showTimer = useRef<number | null>(null)
  const hideTimer = useRef<number | null>(null)

  const q = encodeURIComponent(address)
  const embedUrl = `https://maps.google.com/maps?q=${q}&output=embed`
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${q}`

  const onEnter = useCallback(() => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
    showTimer.current = window.setTimeout(() => setVisible(true), 120)
  }, [])

  const onLeave = useCallback(() => {
    if (showTimer.current) {
      window.clearTimeout(showTimer.current)
      showTimer.current = null
    }
    hideTimer.current = window.setTimeout(() => setVisible(false), 120)
  }, [])

  useEffect(() => {
    return () => {
      if (showTimer.current) window.clearTimeout(showTimer.current)
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
    }
  }, [])

  return (
    <span className="loc">
      <span className="loc-trigger" onMouseEnter={onEnter} onMouseLeave={onLeave}>
        {address}
      </span>
      {visible && (
        <div className="loc-popover" onMouseEnter={onEnter} onMouseLeave={onLeave}>
          <iframe
            className="loc-frame"
            src={embedUrl}
            title={t('establishment.mapAlt', { address })}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a className="loc-link" href={mapUrl} target="_blank" rel="noopener noreferrer">
            {t('location.openInMaps')}
          </a>
        </div>
      )}
    </span>
  )
}
