export default function StarBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const stars = '★'.repeat(max)
  return (
    <span className="starbar" title={`${value.toFixed(2)} / ${max}`} aria-label={`${value.toFixed(2)} de ${max}`}>
      <span className="starbar-empty" aria-hidden>{stars}</span>
      <span className="starbar-fill" style={{ width: `${pct}%` }} aria-hidden>{stars}</span>
    </span>
  )
}
