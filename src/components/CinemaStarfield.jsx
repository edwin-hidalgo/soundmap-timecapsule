/**
 * CinemaStarfield — recording-only ambient star parallax (?cinema=1)
 *
 * Two translucent star layers drifting over deep space, blended with `screen`.
 * Both move in the same general direction as Mapbox's own star field during
 * the west→east spin (leftward on screen), but slower — back layer slightly
 * faster than front for depth parallax.
 *
 * The globe itself is kept clear via a feathered radial mask: at the cinema
 * zoom (1.7) the globe is a ~265px-radius circle at screen center
 * (512 · 2^zoom / 2π), so the mask hole starts at 280px and feathers to 350px.
 *
 * Loop safety: both animations run a 30s period (= one globe revolution) and
 * each drifts EXACTLY one background tile per period, so the pattern state at
 * t=0 and t=30s is identical — a one-revolution recording loops seamlessly.
 */
export default function CinemaStarfield() {
  const mask = 'radial-gradient(circle at 50% 50%, transparent 0 280px, black 350px)'

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 5,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    >
      <style>{`
        @keyframes star-drift-back {
          from { background-position: 0px 0px; }
          to   { background-position: -220px 0px; }
        }
        @keyframes star-drift-front {
          from { background-position: 0px 0px; }
          to   { background-position: -140px 130px; }
        }
      `}</style>

      {/* Back layer — small dense stars, slightly faster leftward drift (one 220x200 tile / 30s) */}
      <div
        className="absolute inset-0"
        style={{
          mixBlendMode: 'screen',
          opacity: 0.35,
          backgroundImage: `
            radial-gradient(1px 1px at 25px 35px, rgba(255,255,255,0.9) 50%, transparent 100%),
            radial-gradient(1px 1px at 110px 90px, rgba(255,255,255,0.7) 50%, transparent 100%),
            radial-gradient(1px 1px at 190px 20px, rgba(200,215,255,0.8) 50%, transparent 100%),
            radial-gradient(1px 1px at 70px 150px, rgba(255,255,255,0.6) 50%, transparent 100%),
            radial-gradient(1px 1px at 160px 170px, rgba(255,240,220,0.7) 50%, transparent 100%)
          `,
          backgroundSize: '220px 200px',
          animation: 'star-drift-back 30s linear infinite',
        }}
      />

      {/* Front layer — fewer, larger stars, slower left-down drift (one 140x130 tile / 30s) */}
      <div
        className="absolute inset-0"
        style={{
          mixBlendMode: 'screen',
          opacity: 0.25,
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 55px 60px, rgba(255,255,255,1) 50%, transparent 100%),
            radial-gradient(2px 2px at 115px 105px, rgba(210,225,255,0.9) 50%, transparent 100%)
          `,
          backgroundSize: '140px 130px',
          animation: 'star-drift-front 30s linear infinite',
        }}
      />
    </div>
  )
}
