/**
 * Decorative food emojis tiled behind the app in the "feast" theme.
 * Rendered as accent-colored silhouettes (transparent glyph + text-shadow)
 * so they read like a soft stamp/shadow rather than full-color emoji.
 */
const FOOD_EMOJI = [
  '🍕', '🍔', '🍟', '🌭', '🌮', '🌯', '🥗', '🍣',
  '🍜', '🍩', '🍪', '🍰', '🍦', '🥐', '🥞', '🧀',
  '🍇', '🍓', '🥑', '🍤', '🍺', '🥟',
]

const TILE_COUNT = 240

export default function FoodBackground() {
  return (
    <div className="food-bg" aria-hidden>
      {Array.from({ length: TILE_COUNT }, (_, i) => (
        <span key={i}>{FOOD_EMOJI[i % FOOD_EMOJI.length]}</span>
      ))}
    </div>
  )
}
