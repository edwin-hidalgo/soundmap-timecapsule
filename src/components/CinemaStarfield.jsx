/**
 * CinemaStarfield — recording-only ambient star parallax (?cinema=1)
 *
 * Two star layers drifting left→right, matching the travel direction of
 * Mapbox's own star field during the west→east spin but slower. Back layer
 * faster than front for depth parallax. Star design mirrors Mapbox's: crisp
 * white points, varied sizes and brightness, slight cool/warm tints.
 *
 * The globe itself is kept clear via a feathered radial mask: at the cinema
 * zoom (1.7) the globe is a ~265px-radius circle at screen center
 * (512 · 2^zoom / 2π), so the mask hole starts at 280px and feathers to 350px.
 *
 * Loop safety: both animations run a 30s period (= one globe revolution) and
 * drift an EXACT number of background tiles per period (back 3, front 2), so
 * the pattern at t=0 and t=30s is identical — one-revolution recordings loop
 * seamlessly.
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
          to   { background-position: 660px 0px; }
        }
        @keyframes star-drift-front {
          from { background-position: 0px 0px; }
          to   { background-position: 280px 0px; }
        }
      `}</style>

      {/* Back layer — dense field, faster rightward drift (3 × 220px tiles / 30s ≈ 22px/s) */}
      <div
        className="absolute inset-0"
        style={{
          mixBlendMode: 'screen',
          opacity: 0.8,
          backgroundImage: `
            radial-gradient(1px 1px at 25px 35px, rgba(255,255,255,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 110px 90px, rgba(255,255,255,0.9) 50%, transparent 100%),
            radial-gradient(1px 1px at 190px 20px, rgba(205,220,255,0.95) 50%, transparent 100%),
            radial-gradient(0.8px 0.8px at 70px 150px, rgba(255,255,255,0.7) 50%, transparent 100%),
            radial-gradient(1.2px 1.2px at 160px 170px, rgba(255,242,220,0.9) 50%, transparent 100%),
            radial-gradient(0.8px 0.8px at 40px 110px, rgba(255,255,255,0.6) 50%, transparent 100%),
            radial-gradient(1px 1px at 205px 130px, rgba(220,230,255,0.8) 50%, transparent 100%)
          `,
          backgroundSize: '220px 200px',
          animation: 'star-drift-back 30s linear infinite',
        }}
      />

      {/* Front layer — fewer, brighter stars, slower rightward drift (2 × 140px tiles / 30s ≈ 9px/s) */}
      <div
        className="absolute inset-0"
        style={{
          mixBlendMode: 'screen',
          opacity: 0.7,
          backgroundImage: `
            radial-gradient(1.8px 1.8px at 55px 60px, rgba(255,255,255,1) 50%, transparent 100%),
            radial-gradient(2.2px 2.2px at 115px 105px, rgba(215,228,255,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 20px 20px, rgba(255,244,225,0.95) 50%, transparent 100%)
          `,
          backgroundSize: '140px 130px',
          animation: 'star-drift-front 30s linear infinite',
        }}
      />
    </div>
  )
}
