'use client';

import { useEffect, useState } from 'react';

const nodes: { x: number; y: number; r: number; dur: number; delay: number }[] = [
  { x: 18, y: 12, r: 0.9, dur: 5.2, delay: 0 },
  { x: 132, y: 8, r: 1.1, dur: 6.1, delay: 0.6 },
  { x: 150, y: 26, r: 0.8, dur: 4.4, delay: 1.1 },
  { x: 140, y: 52, r: 1.0, dur: 5.6, delay: 0.3 },
  { x: 120, y: 74, r: 0.9, dur: 6.4, delay: 1.8 },
  { x: 150, y: 88, r: 1.2, dur: 5.0, delay: 0.9 },
  { x: 100, y: 92, r: 0.7, dur: 4.2, delay: 1.4 },
  { x: 70, y: 88, r: 0.9, dur: 5.8, delay: 0.2 },
  { x: 30, y: 82, r: 1.0, dur: 5.3, delay: 1.6 },
  { x: 8, y: 60, r: 0.8, dur: 4.6, delay: 0.7 },
  { x: 5, y: 30, r: 1.0, dur: 6.0, delay: 1.2 },
  { x: 45, y: 6, r: 0.7, dur: 4.9, delay: 0.4 },
  { x: 90, y: 14, r: 0.8, dur: 4.7, delay: 1.0 },
  { x: 110, y: 40, r: 0.9, dur: 5.4, delay: 0.5 },
  { x: 60, y: 50, r: 0.6, dur: 6.2, delay: 1.9 },
  { x: 80, y: 60, r: 0.7, dur: 5.7, delay: 0.8 },
];

const edges: [number, number][] = [
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, 0],
  [0, 11],
  [11, 12],
  [12, 13],
  [13, 3],
  [13, 14],
  [14, 15],
  [15, 4],
];

const pulses: { edge: number; dur: number; delay: number; gold?: boolean }[] = [
  { edge: 2, dur: 7, delay: 0 },
  { edge: 7, dur: 9, delay: 2.5 },
  { edge: 13, dur: 11, delay: 5, gold: true },
];

export function AmbientNetwork() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    // reduced-motion preference must be read from the browser after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnimate(!query.matches);
    const onChange = () => setAnimate(!query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return (
    <svg
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-70"
      viewBox="0 0 160 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {edges.map(([a, b], i) => {
        const na = nodes[a];
        const nb = nodes[b];
        return (
          <path
            key={i}
            id={`edge-${i}`}
            d={`M${na.x} ${na.y} L${nb.x} ${nb.y}`}
            fill="none"
            stroke="#39365c"
            strokeWidth="0.1"
          />
        );
      })}

      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.r * 0.22} fill="#8f82e0" opacity={0.4}>
          {animate && (
            <animate
              attributeName="opacity"
              values="0.15;0.75;0.15"
              dur={`${n.dur}s`}
              begin={`${n.delay}s`}
              repeatCount="indefinite"
            />
          )}
        </circle>
      ))}

      {animate &&
        pulses.map((p, i) => (
          <circle key={i} r={0.45} fill={p.gold ? "#e7b75c" : "#c9beff"}>
            <animateMotion
              dur={`${p.dur}s`}
              begin={`${p.delay}s`}
              repeatCount="indefinite"
            >
              <mpath href={`#edge-${p.edge}`} />
            </animateMotion>
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.08;0.92;1"
              dur={`${p.dur}s`}
              begin={`${p.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
    </svg>
  );
}
