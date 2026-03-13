/**
 * Loompia logo — Filipino movie-poster / signage typography.
 * Uses "Boogaloo" (loaded in index.html) — bold, rounded, hand-lettered feel
 * inspired by classic Filipino title cards.
 */
export default function Logo() {
  return (
    <span
      style={{
        fontFamily: "'Boogaloo', cursive",
        fontSize: '1.35rem',
        letterSpacing: '0.06em',
        lineHeight: 1,
        background: 'linear-gradient(160deg, #F5C842 0%, #E8A020 55%, #C96B0A 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textShadow: 'none',
        filter: 'drop-shadow(0 1px 3px rgba(229,160,32,0.35))',
        userSelect: 'none',
      }}
    >
      LOOMPIA
    </span>
  )
}
