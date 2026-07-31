/**
 * Fixed, full-viewport background shared by every route: a soft violet glow
 * behind a CRT-scanline texture. Mounted once in the root layout so every
 * page shares the same overlay instead of stacking one per section. Sits
 * behind all content and ignores pointer events so clicks/hover pass
 * through untouched.
 */
export default function ScanlinesOverlay() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[-1] pointer-events-none"
    >
      {/* Background glow — painted first so it sits behind the scanlines. */}
      <div
        className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1000px] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, var(--color-accent-violet) 0%, transparent 70%)',
          opacity: 0.2,
        }}
      />
      {/* CRT scanlines — unchanged. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 3px)',
        }}
      />
    </div>
  );
}
