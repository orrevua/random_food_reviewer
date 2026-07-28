type Props = {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  block?: boolean
}

export default function Spinner({ size = 'md', label, block = false }: Props) {
  const cls = `spinner spinner--${size}`
  if (block) {
    return (
      <div className="spinner-block" role="status" aria-live="polite">
        <span className={cls} aria-hidden />
        {label && <span className="spinner-label">{label}</span>}
      </div>
    )
  }
  return (
    <span role="status" aria-live="polite" className="spinner-inline">
      <span className={cls} aria-hidden />
      {label && <span className="spinner-label">{label}</span>}
    </span>
  )
}
