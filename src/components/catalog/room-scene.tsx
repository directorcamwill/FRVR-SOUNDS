"use client";

import { memo } from "react";

// Per-room animated background scene. Unique composition per slug — feels
// like you're looking into a real space through a window. Pure CSS/SVG, no
// video assets needed. Each scene is a dense mood piece, not a gradient.

type Props = {
  slug: string;
  accent: string;
};

function BoothScene({ accent }: { accent: string }) {
  // Late-night vocal booth — amber spotlight drifting over warm haze
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 40% 30% at 50% 75%, ${accent}88 0%, transparent 55%),
            radial-gradient(ellipse 80% 60% at 50% 100%, #1a0033 0%, transparent 70%),
            linear-gradient(180deg, #050007 0%, #0a0015 100%)
          `,
        }}
      />
      {/* Spotlight beam */}
      <div
        className="absolute inset-0 animate-[drift_18s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(ellipse 30% 80% at 50% 0%, ${accent}55 0%, transparent 50%)`,
          filter: "blur(30px)",
          transformOrigin: "50% 100%",
        }}
      />
      {/* Smoke layer */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><filter id='s'><feTurbulence type='fractalNoise' baseFrequency='0.008' numOctaves='3' seed='5'/><feColorMatrix values='0 0 0 0 0.6  0 0 0 0 0.3  0 0 0 0 0.8  0 0 0 0.8 0'/></filter><rect width='100%' height='100%' filter='url(%23s)'/></svg>\")",
          mixBlendMode: "screen",
          animation: "drift 30s ease-in-out infinite",
        }}
      />
      {/* Mic silhouette */}
      <svg
        className="absolute left-1/2 top-[55%] -translate-x-1/2 opacity-40"
        width="90"
        height="160"
        viewBox="0 0 90 160"
      >
        <ellipse cx="45" cy="45" rx="24" ry="32" fill="#000" stroke={accent} strokeOpacity="0.6" />
        <line x1="45" y1="77" x2="45" y2="130" stroke={accent} strokeOpacity="0.5" strokeWidth="2" />
        <ellipse cx="45" cy="140" rx="18" ry="4" fill={accent} fillOpacity="0.3" />
      </svg>
    </>
  );
}

function BasementScene({ accent }: { accent: string }) {
  // Lo-fi underground — flickering bare bulb, dust falling
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 30% at 50% 30%, ${accent}66 0%, transparent 60%),
            linear-gradient(180deg, #0a0000 0%, #000000 50%, #050000 100%)
          `,
        }}
      />
      {/* Hanging bulb */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2">
        <div
          className="size-8 rounded-full"
          style={{
            background: `radial-gradient(circle, ${accent} 0%, ${accent}aa 30%, transparent 70%)`,
            filter: "blur(1px)",
            animation: "pulse-glow 3s ease-in-out infinite",
            boxShadow: `0 0 40px ${accent}, 0 0 80px ${accent}aa`,
          }}
        />
        <div className="absolute top-0 left-1/2 w-[1px] h-16 -translate-x-1/2 -translate-y-full bg-white/10" />
      </div>
      {/* Dust particles falling */}
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="absolute size-[2px] rounded-full bg-white/40"
          style={{
            top: "-10%",
            left: `${(i * 5.7) % 100}%`,
            animation: `dust-fall ${8 + (i % 5) * 2}s linear ${i * 0.3}s infinite`,
            opacity: 0.3 + (i % 3) * 0.2,
          }}
        />
      ))}
      {/* Vinyl record detail */}
      <svg
        className="absolute right-[-15%] bottom-[-20%] opacity-25 animate-[slow-rotate_60s_linear_infinite]"
        width="200"
        height="200"
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="95" fill="#111" stroke="#333" strokeWidth="1" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="#222" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="#222" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="25" fill={accent} />
        <circle cx="100" cy="100" r="3" fill="#000" />
      </svg>
    </>
  );
}

function OvertureScene({ accent }: { accent: string }) {
  // Orchestral sweep — radiating light rays, gold sparkles
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 80% at 50% 50%, ${accent}77 0%, transparent 55%),
            linear-gradient(180deg, #0a0800 0%, #000000 100%)
          `,
        }}
      />
      {/* Radiating rays */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 500"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="overture-glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.6" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="200"
            y1="250"
            x2={200 + Math.cos((i * Math.PI) / 6) * 400}
            y2={250 + Math.sin((i * Math.PI) / 6) * 400}
            stroke={accent}
            strokeOpacity="0.15"
            strokeWidth="1"
            style={{
              animation: `breath ${4 + i * 0.3}s ease-in-out infinite`,
            }}
          />
        ))}
        <circle cx="200" cy="250" r="120" fill="url(#overture-glow)" />
      </svg>
      {/* Gold sparkles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            top: `${(i * 17) % 100}%`,
            left: `${(i * 23) % 100}%`,
            width: `${1 + (i % 3)}px`,
            height: `${1 + (i % 3)}px`,
            background: accent,
            boxShadow: `0 0 4px ${accent}`,
            animation: `sparkle ${2 + (i % 4)}s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </>
  );
}

function DriveScene({ accent }: { accent: string }) {
  // Synthwave highway — scrolling grid, neon sun
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, #0a0020 0%, #200040 35%, #000 70%, #000 100%)
          `,
        }}
      />
      {/* Neon sun */}
      <div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "180px",
          height: "90px",
          background: `radial-gradient(ellipse at 50% 100%, ${accent} 0%, #ff00ff 40%, transparent 70%)`,
          borderRadius: "50% 50% 0 0",
          filter: "blur(1px)",
          boxShadow: `0 0 60px ${accent}, 0 0 120px ${accent}aa`,
        }}
      />
      {/* Horizon line */}
      <div
        className="absolute left-0 right-0 h-[1px]"
        style={{
          top: "50%",
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          boxShadow: `0 0 20px ${accent}`,
        }}
      />
      {/* Perspective grid */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(${accent}80 1px, transparent 1px),
            linear-gradient(90deg, ${accent}80 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          transform: "perspective(300px) rotateX(60deg)",
          transformOrigin: "50% 0",
          animation: "grid-scroll 2s linear infinite",
        }}
      />
    </>
  );
}

function FieldScene({ accent }: { accent: string }) {
  // Americana — golden hour, wheat waves, warm horizon
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, #1a0a00 0%, #3a1a05 20%, #0a0300 60%, #000 100%)
          `,
        }}
      />
      {/* Warm sun glow at horizon */}
      <div
        className="absolute left-1/2 top-[40%] -translate-x-1/2"
        style={{
          width: "260px",
          height: "140px",
          background: `radial-gradient(ellipse, ${accent} 0%, transparent 65%)`,
          filter: "blur(20px)",
          opacity: 0.7,
        }}
      />
      {/* Wheat wave */}
      <svg
        className="absolute inset-x-0 bottom-0 w-full"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        style={{ height: "55%" }}
      >
        <defs>
          <linearGradient id="field-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          fill="url(#field-fade)"
          d="M0,100 Q50,70 100,90 T200,85 T300,95 T400,80 L400,200 L0,200 Z"
          style={{ animation: "field-wave 12s ease-in-out infinite" }}
        />
        <path
          fill="#000"
          fillOpacity="0.6"
          d="M0,140 Q60,115 120,130 T240,125 T360,135 T400,125 L400,200 L0,200 Z"
        />
      </svg>
      {/* Dust motes */}
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            top: `${30 + (i * 7) % 40}%`,
            left: `${(i * 11) % 100}%`,
            width: "3px",
            height: "3px",
            background: accent,
            opacity: 0.4,
            animation: `float-slow ${6 + (i % 5)}s ease-in-out ${i * 0.4}s infinite`,
          }}
        />
      ))}
    </>
  );
}

function AlleyScene({ accent }: { accent: string }) {
  // Crime/thriller — flickering neon sign, rain, red emergency pulse
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 40% 30% at 75% 20%, ${accent}aa 0%, transparent 60%),
            linear-gradient(180deg, #080010 0%, #000 100%)
          `,
        }}
      />
      {/* Rain streaks */}
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            top: "-20%",
            left: `${(i * 4.3) % 100}%`,
            width: "1px",
            height: "40px",
            background: `linear-gradient(180deg, transparent, ${accent}66, transparent)`,
            animation: `rain-fall ${1 + (i % 3) * 0.2}s linear ${i * 0.05}s infinite`,
          }}
        />
      ))}
      {/* Neon sign flicker */}
      <div
        className="absolute top-[22%] right-[15%]"
        style={{
          width: "70px",
          height: "10px",
          background: accent,
          boxShadow: `0 0 25px ${accent}, 0 0 50px ${accent}aa`,
          animation: "flicker 4s infinite",
        }}
      />
      <div
        className="absolute top-[26%] right-[18%]"
        style={{
          width: "50px",
          height: "4px",
          background: accent,
          boxShadow: `0 0 15px ${accent}`,
          animation: "flicker 5.2s infinite",
        }}
      />
      {/* Window light cast */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/2"
        style={{
          background: `linear-gradient(180deg, transparent, ${accent}22 100%)`,
        }}
      />
    </>
  );
}

function ReelScene({ accent }: { accent: string }) {
  // Film scores — projector flicker, film strip, analog warmth
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 40% 30% at 50% 20%, ${accent}55 0%, transparent 60%),
            linear-gradient(180deg, #000500 0%, #000 60%)
          `,
        }}
      />
      {/* Projector beam */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 origin-top"
        style={{
          width: "5px",
          height: "60%",
          background: `linear-gradient(180deg, ${accent}aa 0%, transparent 90%)`,
          filter: "blur(8px)",
          transform: "rotateX(-5deg) scaleX(40)",
          animation: "breath 4s ease-in-out infinite",
        }}
      />
      {/* Film strip border */}
      <div
        className="absolute inset-y-0 left-0 w-8"
        style={{
          background: "#000",
          backgroundImage:
            "repeating-linear-gradient(180deg, transparent 0, transparent 10px, #333 10px, #333 18px, transparent 18px, transparent 28px)",
          animation: "film-scroll 3s linear infinite",
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-8"
        style={{
          background: "#000",
          backgroundImage:
            "repeating-linear-gradient(180deg, transparent 0, transparent 10px, #333 10px, #333 18px, transparent 18px, transparent 28px)",
          animation: "film-scroll 3s linear infinite",
        }}
      />
      {/* Scanline flicker */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, transparent 0, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 3px)",
          opacity: 0.5,
        }}
      />
    </>
  );
}

function LostFoundScene({ accent }: { accent: string }) {
  // VHS channel surfing — color bars, static, tracking glitches
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: "#000" }}
      />
      {/* Color bars */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(90deg,
            #fff 0%, #fff 14%,
            #ff0 14%, #ff0 28%,
            #0ff 28%, #0ff 42%,
            #0f0 42%, #0f0 57%,
            #f0f 57%, #f0f 71%,
            #f00 71%, #f00 85%,
            #00f 85%, #00f 100%)`,
          animation: "vhs-shift 6s steps(8) infinite",
        }}
      />
      {/* Static noise */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='2' numOctaves='1'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          mixBlendMode: "overlay",
          animation: "grain-shift 0.8s steps(4) infinite",
        }}
      />
      {/* Scanline */}
      <div
        className="absolute left-0 right-0 h-4"
        style={{
          background: `linear-gradient(180deg, transparent, ${accent}44, transparent)`,
          animation: "tracking-glitch 7s linear infinite",
        }}
      />
      {/* "REC" indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5">
        <span
          className="size-2 rounded-full live-dot"
          style={{ background: "#ff0033", boxShadow: "0 0 8px #ff0033" }}
        />
        <span className="text-[9px] font-mono text-white/70 tracking-widest">
          REC
        </span>
      </div>
    </>
  );
}

const SCENE_MAP: Record<string, (p: { accent: string }) => React.ReactElement> = {
  "the-booth": BoothScene,
  "the-basement": BasementScene,
  "the-overture": OvertureScene,
  "the-drive": DriveScene,
  "the-field": FieldScene,
  "the-alley": AlleyScene,
  "the-reel": ReelScene,
  "lost-and-found": LostFoundScene,
};

export const RoomScene = memo(function RoomScene({ slug, accent }: Props) {
  const Scene = SCENE_MAP[slug];
  if (!Scene) {
    // Generic fallback for any new room
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 30% 20%, ${accent}55 0%, transparent 60%),
            radial-gradient(ellipse 70% 80% at 80% 90%, ${accent}33 0%, transparent 70%),
            linear-gradient(180deg, #0A0A0A 0%, #000000 100%)
          `,
        }}
      />
    );
  }
  return <Scene accent={accent} />;
});
