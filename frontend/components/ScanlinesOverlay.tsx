/**
 * Fixed, full-viewport atmospheric background shared by every route.
 *
 * Render order (back to front):
 *   1. near-black base (from `body`)
 *   2. five independently drifting light sources
 *   3. a subtle vignette
 *   4. the CRT scanline texture
 *
 * Mounted once in the root layout, so the same lighting field spans every
 * page and every section rather than restarting per section. Sits behind all
 * content and ignores pointer events so clicks/hover pass through untouched.
 */

interface Light {
  /** Debug/readability only — which light this is. */
  name: string;
  color: string;
  /** Diameter in px. */
  size: number;
  opacity: number;
  /** Seconds for one full drift cycle. */
  duration: number;
  blur: number;
  left: string;
  top: string;
  keyframes: string;
}

const LIGHTS: Light[] = [
  {
    name: 'deep violet',
    color: '#4C1D95',
    size: 760,
    opacity: 0.30,
    duration: 27,
    blur: 60,
    left: '12%',
    top: '8%',
    keyframes: 'drift-1',
  },
  {
    name: 'electric violet',
    color: '#6D28D9',
    size: 620,
    opacity: 0.26,
    duration: 18,
    blur: 55,
    left: '58%',
    top: '18%',
    keyframes: 'drift-2',
  },
  {
    name: 'blue violet',
    color: '#4338CA',
    size: 700,
    opacity: 0.22,
    duration: 23,
    blur: 58,
    left: '4%',
    top: '55%',
    keyframes: 'drift-3',
  },
  {
    name: 'deep purple',
    color: '#5B21B6',
    size: 580,
    opacity: 0.24,
    duration: 21,
    blur: 52,
    left: '46%',
    top: '62%',
    keyframes: 'drift-4',
  },
  {
    name: 'dark lavender',
    color: '#6D28D9',
    size: 500,
    opacity: 0.16,
    duration: 31,
    blur: 50,
    left: '78%',
    top: '2%',
    keyframes: 'drift-5',
  },
];

export default function ScanlinesOverlay() {
  return (
    <div aria-hidden="true" className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
      {/* Atmospheric light sources — painted first, behind everything else. */}
      {LIGHTS.map((light) => (
        <div
          key={light.name}
          className="atmos-light absolute rounded-full"
          style={{
            left: light.left,
            top: light.top,
            width: `${light.size}px`,
            height: `${light.size}px`,
            background: `radial-gradient(circle, ${light.color} 0%, ${light.color}66 32%, transparent 62%)`,
            opacity: light.opacity,
            filter: `blur(${light.blur}px)`,
            animation: `${light.keyframes} ${light.duration}s ease-in-out infinite`,
            willChange: 'transform',
          }}
        />
      ))}

      {/* Vignette — pulls the edges down so the lights read as illumination. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
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
