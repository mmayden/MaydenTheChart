/**
 * Lumpio logo — bold, rounded, hand-lettered feel.
 * Uses "Boogaloo" (loaded in index.html).
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
      LUMPIO
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.55rem',
          fontWeight: 800,
          letterSpacing: '0.12em',
          marginLeft: '0.4em',
          verticalAlign: 'super',
          WebkitTextFillColor: '#9ca3af',
          background: 'none',
          filter: 'none',
        }}
      >
        BETA
      </span>
    </span>
  )
}
