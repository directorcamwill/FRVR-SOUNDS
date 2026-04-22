"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Stars,
  Html,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";
import type { BrandModuleId } from "@/types/brand";
import { BRAND_MODULES } from "@/lib/brand/modules";
import { computeModuleCompleteness } from "@/lib/brand/validation";
import type { BrandWiki } from "@/types/brand";

/**
 * A single chrome/red globe. Markers live ON the surface (no orbiting
 * planets) as flat tech-HUD hotspots. Palette is strict: chrome silver +
 * laser red + tech glow blue — nothing else. Clicking a marker rotates the
 * globe so the marker faces the camera (cinematic zoom).
 */

const GLOBE_RADIUS = 1.9;
const LASER_RED = "#DC2626";
const TECH_BLUE = "#22d3ee";

function fibonacciSurface(count: number, r = GLOBE_RADIUS): THREE.Vector3[] {
  const phi = Math.PI * (3 - Math.sqrt(5));
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;
    out.push(
      new THREE.Vector3(
        Math.cos(theta) * radius * r,
        y * r,
        Math.sin(theta) * radius * r,
      ),
    );
  }
  return out;
}

export function BrandWikiGlobe({
  wiki,
  selectedModule,
  onSelectModule,
  speaking = false,
}: {
  wiki: BrandWiki;
  selectedModule: BrandModuleId | null;
  onSelectModule: (id: BrandModuleId | null) => void;
  speaking?: boolean;
}) {
  const wikiRecord = wiki as unknown as Record<string, unknown>;
  // Surface positions sit exactly on the sphere (radius = GLOBE_RADIUS).
  const positions = useMemo(
    () => fibonacciSurface(BRAND_MODULES.length, GLOBE_RADIUS),
    [],
  );
  const targetNormal = useMemo(() => {
    if (!selectedModule) return null;
    const idx = BRAND_MODULES.findIndex((m) => m.id === selectedModule);
    if (idx < 0) return null;
    return positions[idx].clone().normalize();
  }, [selectedModule, positions]);

  return (
    <Canvas
      camera={{ position: [0, 0, 6.8], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#050505"]} />

      <ambientLight intensity={speaking ? 0.18 : 0.12} />
      <directionalLight position={[4, 3, 5]} intensity={0.55} color="#ffffff" />
      <pointLight
        position={[-5, 2, -4]}
        intensity={speaking ? 3.4 : 2}
        color={LASER_RED}
      />
      <pointLight
        position={[5, -3, 2]}
        intensity={speaking ? 2 : 1.1}
        color={LASER_RED}
      />
      <pointLight
        position={[-3, 4, 3]}
        intensity={speaking ? 2.4 : 1.5}
        color={TECH_BLUE}
      />
      <pointLight
        position={[3, -4, -2]}
        intensity={0.8}
        color={TECH_BLUE}
      />
      <pointLight position={[0, -5, 3]} intensity={0.4} color="#ffffff" />

      <Suspense fallback={null}>
        <Environment preset="studio" />
        <Stars
          radius={90}
          depth={50}
          count={4500}
          factor={3}
          saturation={0}
          fade
          speed={speaking ? 1.2 : 0.4}
        />
      </Suspense>

      <SpinningGlobe
        speaking={speaking}
        targetNormal={targetNormal}
      >
        <ChromeSphere speaking={speaking} />
        {BRAND_MODULES.map((mod, i) => {
          const pct = computeModuleCompleteness(mod.questions, wikiRecord);
          const pos = positions[i];
          const isSelected = selectedModule === mod.id;
          return (
            <SurfaceHotspot
              key={mod.id}
              label={mod.label}
              position={pos}
              completeness={pct}
              selected={isSelected}
              onClick={() =>
                onSelectModule(isSelected ? null : mod.id)
              }
            />
          );
        })}
      </SpinningGlobe>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={(5 * Math.PI) / 6}
        rotateSpeed={0.6}
        autoRotate={!selectedModule}
        autoRotateSpeed={speaking ? 1.4 : 0.5}
      />
    </Canvas>
  );
}

function SpinningGlobe({
  children,
  speaking = false,
  targetNormal,
}: {
  children: React.ReactNode;
  speaking?: boolean;
  /** When set, the globe rotates so this normal faces the camera (+Z). */
  targetNormal: THREE.Vector3 | null;
}) {
  const ref = useRef<THREE.Group>(null);
  const targetQuat = useMemo(() => {
    if (!targetNormal) return null;
    // Rotate the surface normal onto +Z so the marker faces the camera.
    return new THREE.Quaternion().setFromUnitVectors(
      targetNormal,
      new THREE.Vector3(0, 0, 1),
    );
  }, [targetNormal]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    if (targetQuat) {
      // Lerp into the selected orientation — cinematic zoom-to-section.
      ref.current.quaternion.slerp(targetQuat, Math.min(1, delta * 3));
      // Subtle breath while locked on — so chrome reflections keep moving.
      const t = state.clock.getElapsedTime();
      ref.current.scale.setScalar(
        1 + (speaking ? Math.sin(t * 6) * 0.018 : Math.sin(t * 1.2) * 0.006),
      );
    } else {
      // Free-spin idle motion.
      const speed = speaking ? 0.28 : 0.12;
      ref.current.rotation.y += delta * speed;
      const wobble = speaking ? 0.14 : 0.08;
      ref.current.rotation.x =
        Math.sin(state.clock.getElapsedTime() * 0.15) * wobble;
      const baseScale = speaking
        ? 1 + Math.sin(state.clock.getElapsedTime() * 6) * 0.018
        : 1;
      ref.current.scale.setScalar(baseScale);
    }
  });

  return <group ref={ref}>{children}</group>;
}

function ChromeSphere({ speaking = false }: { speaking?: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const mat = coreRef.current?.material as
      | THREE.MeshStandardMaterial
      | undefined;
    if (!mat) return;
    if (speaking) {
      const t = state.clock.getElapsedTime();
      mat.emissiveIntensity = 0.4 + (Math.sin(t * 9) * 0.5 + 0.5) * 1.5;
    } else {
      mat.emissiveIntensity = 0.4;
    }
  });

  return (
    <group>
      {/* Primary chrome sphere — shiny liquid silver. The metal carries
          most of the look; emissive kept low so specular doesn't blow out. */}
      <mesh ref={coreRef} castShadow receiveShadow>
        <icosahedronGeometry args={[GLOBE_RADIUS, 12]} />
        <meshStandardMaterial
          color="#c0c6d0"
          metalness={1}
          roughness={0.12}
          envMapIntensity={speaking ? 1.6 : 1.2}
          emissive={LASER_RED}
          emissiveIntensity={0.18}
        />
      </mesh>

      {/* Thin red clearcoat glaze — kept subtle so silver shows through. */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.002, 128, 128]} />
        <meshPhysicalMaterial
          color="#2b0a0e"
          metalness={0.6}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.05}
          emissive={LASER_RED}
          emissiveIntensity={0.08}
          transparent
          opacity={0.28}
        />
      </mesh>

      {/* Tech-blue wireframe grid — clearly visible now for the HUD feel. */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.004, 32, 24]} />
        <meshBasicMaterial
          color={TECH_BLUE}
          wireframe
          transparent
          opacity={0.14}
        />
      </mesh>

      {/* Thin red meridian wireframe on top for that laser-etched look. */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.005, 48, 12]} />
        <meshBasicMaterial
          color={LASER_RED}
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* Equatorial halo — laser red */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry
          args={[GLOBE_RADIUS * 1.35, GLOBE_RADIUS * 1.37, 128]}
        />
        <meshBasicMaterial
          color={LASER_RED}
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Tilted halo — tech blue */}
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 5]}>
        <ringGeometry
          args={[GLOBE_RADIUS * 1.48, GLOBE_RADIUS * 1.5, 128]}
        />
        <meshBasicMaterial
          color={TECH_BLUE}
          transparent
          opacity={0.32}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/**
 * Flat surface hotspot — no raised geometry, no colored planet. Concentric
 * glowing rings flush with the globe surface. Red by default, tech-blue
 * when selected. Label fades out on the back hemisphere.
 */
function SurfaceHotspot({
  label,
  position,
  completeness,
  selected,
  onClick,
}: {
  label: string;
  position: THREE.Vector3;
  completeness: number;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const innerRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const labelOpacityRef = useRef(1);

  const accent = selected ? TECH_BLUE : LASER_RED;
  const active = selected || hovered;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Pulse outer ring
    if (outerRef.current) {
      const s = (selected ? 1.2 : hovered ? 1.05 : 1) +
        Math.sin(t * 2.4 + position.x * 3) * 0.08;
      outerRef.current.scale.setScalar(s);
    }
    if (innerRef.current) {
      const s = (selected ? 1.3 : hovered ? 1.15 : 1) +
        Math.sin(t * 3 + position.x) * 0.05;
      innerRef.current.scale.setScalar(s);
    }
    // Visibility: fade the label based on dot product of marker normal and
    // camera forward — only show when facing camera.
    if (groupRef.current) {
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      const camPos = state.camera.position;
      const toCamera = camPos.clone().sub(worldPos).normalize();
      const normal = worldPos.clone().normalize();
      const facing = normal.dot(toCamera); // 1 = facing, -1 = away
      labelOpacityRef.current = THREE.MathUtils.clamp(
        (facing - 0.05) * 1.6,
        0,
        1,
      );
    }
  });

  // Position the hotspot group at the marker point with its local +Z = outward normal
  const normal = position.clone().normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    normal,
  );
  // Push slightly outward so rings sit just above the surface (avoid z-fighting)
  const offsetPos = position.clone().add(normal.multiplyScalar(0.003));

  return (
    <group ref={groupRef} position={offsetPos} quaternion={quat}>
      {/* Outer pulsing ring — flat on surface */}
      <mesh ref={outerRef}>
        <ringGeometry args={[0.11, 0.15, 48]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={active ? 1 : 0.65}
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>
      {/* Tech crosshairs — short dashes at 4 cardinal points */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => (
        <mesh
          key={angle}
          position={[Math.cos(angle) * 0.18, Math.sin(angle) * 0.18, 0]}
          rotation={[0, 0, angle]}
        >
          <planeGeometry args={[0.04, 0.004]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={active ? 0.95 : 0.45}
            depthTest={false}
          />
        </mesh>
      ))}
      {/* Inner solid dot — the clickable target */}
      <mesh
        ref={innerRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <circleGeometry args={[0.06, 24]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={1}
          depthTest={false}
        />
      </mesh>

      <Html
        center
        distanceFactor={8}
        position={[0, 0, 0.1]}
        zIndexRange={[5, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          style={{
            padding: "3px 9px",
            borderRadius: 2,
            background: "rgba(5,5,5,0.78)",
            border: `1px solid ${active ? accent : "rgba(200,200,210,0.2)"}`,
            color: "#fff",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            backdropFilter: "blur(8px)",
            boxShadow: active
              ? `0 0 14px ${accent}, inset 0 0 10px ${accent}33`
              : "0 0 6px rgba(0,0,0,0.6)",
            opacity: labelOpacityRef.current,
            transition: "opacity 180ms ease-out, border-color 180ms ease-out, box-shadow 180ms ease-out",
            fontFamily:
              "'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace",
          }}
        >
          {label}
          <span
            style={{
              opacity: 0.55,
              marginLeft: 6,
              fontSize: 9,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.05em",
            }}
          >
            {completeness}%
          </span>
        </div>
      </Html>
    </group>
  );
}
