import { useMemo } from 'react'

/**
 * Decorative food emojis scattered behind the app in the "feast" theme.
 * Rendered as accent-colored silhouettes (transparent glyph + text-shadow)
 * and placed at pseudo-random positions, rotations and sizes. A fixed seed
 * keeps the layout stable across re-renders.
 */
const FOOD_EMOJI = [
  '🍕', '🍔', '🍟', '🌭', '🌮', '🌯', '🥗', '🍣',
  '🍜', '🍩', '🍪', '🍰', '🍦', '🥐', '🥞', '🧀',
  '🍇', '🍓', '🥑', '🍤', '🍺', '🥟',
]

const COUNT = 70

// Small deterministic PRNG so the scatter is random-looking but stable.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function FoodBackground() {
  const items = useMemo(() => {
    const rand = mulberry32(20260830)
    return Array.from({ length: COUNT }, (_, i) => ({
      key: i,
      emoji: FOOD_EMOJI[Math.floor(rand() * FOOD_EMOJI.length)],
      top: rand() * 100,
      left: rand() * 100,
      size: 22 + rand() * 56, // 22–78px
      rotate: Math.round(rand() * 360),
    }))
  }, [])

  return (
    <div className="food-bg" aria-hidden>
      {items.map((it) => (
        <span
          key={it.key}
          style={{
            top: `${it.top}%`,
            left: `${it.left}%`,
            fontSize: `${it.size}px`,
            transform: `translate(-50%, -50%) rotate(${it.rotate}deg)`,
          }}
        >
          {it.emoji}
        </span>
      ))}
    </div>
  )
}
