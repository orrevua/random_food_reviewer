/**
 * Decorative tiled food shapes shown behind the app in the "feast" theme.
 * Inline SVG so strokes can inherit --accent and no data-URI encoding is needed.
 */
export default function FoodBackground() {
  return (
    <div className="food-bg" aria-hidden>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="food-tile" width="140" height="140" patternUnits="userSpaceOnUse">
            <g
              fill="none"
              stroke="var(--accent)"
              strokeOpacity="0.14"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* pizza slice */}
              <path d="M22 20 L48 30 L30 48 Z" />
              {/* fork */}
              <path d="M100 16 v16 M106 16 v16 M112 16 v16 M106 32 v26" />
              {/* donut */}
              <circle cx="38" cy="104" r="15" />
              <circle cx="38" cy="104" r="5" />
              {/* cup */}
              <path d="M92 92 h22 v12 a11 11 0 0 1 -22 0 Z" />
              <path d="M114 95 h5 a5 5 0 0 1 0 10 h-5" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#food-tile)" />
      </svg>
    </div>
  )
}
