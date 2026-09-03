import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { VIS } from "./constants";
import {
  CameraRig,
  EmergentGalaxy,
  FiveCell,
  FrustrationGhosts,
  HolographicShells,
  PrimeTetra,
  SimClock,
  VacuumNetwork,
  VoidField,
} from "./objects";
import { useSim } from "./store";

function Controls() {
  const enabled = useSim((s) => !s.autoCamera && !s.intro);
  return (
    <OrbitControls
      enabled={enabled}
      enableDamping
      dampingFactor={0.08}
      minDistance={2.4}
      maxDistance={28}
      enablePan={false}
      onStart={() => {
        if (!useSim.getState().intro) useSim.getState().setAutoCamera(false);
      }}
    />
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={[VIS.void]} />
      <fog attach="fog" args={[VIS.void, 10, 36]} />
      <ambientLight intensity={0.35} />
      <SimClock />
      <CameraRig />
      <VoidField />
      <FiveCell />
      <PrimeTetra />
      <VacuumNetwork />
      <FrustrationGhosts />
      <HolographicShells />
      <EmergentGalaxy />
      <Controls />
    </>
  );
}

export function TegCanvas() {
  return (
    <Canvas
      className="absolute inset-0 touch-none"
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0.4, 1.4, 7.2], fov: 48, near: 0.1, far: 80 }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(VIS.void, 1);
        scene.fog = new THREE.Fog(VIS.void, 10, 36);
      }}
    >
      <Scene />
    </Canvas>
  );
}
