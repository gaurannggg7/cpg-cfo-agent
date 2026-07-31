/**
 * Fixed, full-viewport CRT-scanline texture + a subtle violet glow behind
 * the hero. Mounted once in the root layout so every route shares the same
 * overlay instead of stacking one per section. Sits behind all content and
 * ignores pointer events so clicks/hover pass through untouched.
 */
export default function ScanlinesOverlay() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[-1] pointer-events-none"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 3px)',
        }}
      />
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 w-[1200px] h-[800px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, var(--color-accent-violet) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
