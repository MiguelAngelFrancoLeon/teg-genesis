import {
  BookOpen,
  Camera,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CONST_ROWS, DURATION } from "@/sim/constants";
import { EPOCHS } from "@/sim/epochs";
import { useSim } from "@/sim/store";
import { CurvePanel } from "./CurvePanel";
import { Intro } from "./Intro";

function TimeReadout() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let id = 0;
    const loop = () => {
      const t = useSim.getState().time;
      if (ref.current) ref.current.textContent = `${t.toFixed(1)} s`;
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
  return <span ref={ref} className="tabular-nums" />;
}

function Timeline() {
  const inputRef = useRef<HTMLInputElement>(null);
  const seek = useSim((s) => s.seek);
  const jump = useSim((s) => s.jumpEpoch);
  const epochIndex = useSim((s) => s.epochIndex);

  useEffect(() => {
    let id = 0;
    const loop = () => {
      const el = inputRef.current;
      const { time, playing } = useSim.getState();
      if (el && document.activeElement !== el) {
        if (playing || el.value === "") el.value = String(time);
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="hud-panel pointer-events-auto w-full max-w-3xl rounded-xl px-3 py-3 md:px-5">
      <input
        ref={inputRef}
        className="teg-range"
        type="range"
        min={0}
        max={DURATION - 0.05}
        step={0.05}
        defaultValue={0}
        aria-label="Tiempo de la simulación"
        onChange={(e) => seek(Number(e.target.value))}
      />
      <div className="mt-1 flex gap-1 overflow-x-auto">
        {EPOCHS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => jump(e.index)}
            className={`min-h-11 shrink-0 rounded-sm px-2 text-left font-mono text-xs tracking-wide transition-opacity duration-150 md:px-2.5 ${
              e.index === epochIndex ? "text-fg" : "text-subtle hover:text-muted"
            }`}
          >
            {String(e.index + 1).padStart(2, "0")}
            <span className="hidden md:inline"> {e.kicker}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConstantsPanel() {
  const open = useSim((s) => s.constantsOpen);
  const setOpen = useSim((s) => s.setConstantsOpen);
  if (!open) return null;
  return (
    <aside className="hud-panel pointer-events-auto max-h-[min(70dvh,32rem)] w-[min(100%,20rem)] overflow-y-auto rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-xs tracking-[0.16em] text-muted uppercase">
          Cadena algebraica
        </p>
        <Button variant="ghost" size="iconSm" onClick={() => setOpen(false)} aria-label="Cerrar">
          <X />
        </Button>
      </div>
      <p className="mb-3 font-mono text-xs leading-relaxed text-muted">
        z_fund = 4 → D_eff = ln 8 → σ_UV → N_bits = 3 → σ_eff
      </p>
      <ul className="space-y-2">
        {CONST_ROWS.map((row) => (
          <li key={row.symbol} className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
            <span className="font-mono text-xs text-muted">{row.symbol}</span>
            <span className="text-right">
              <span className="block font-mono text-xs text-fg tabular-nums">{row.value}</span>
              <span className="block text-xs text-subtle">{row.note}</span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function TheorySheet() {
  const open = useSim((s) => s.theoryOpen);
  const setOpen = useSim((s) => s.setTheoryOpen);
  if (!open) return null;
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-end justify-center bg-bg/55 p-4 md:items-center">
      <div className="hud-panel max-h-[min(86dvh,40rem)] w-full max-w-lg overflow-y-auto rounded-xl p-5 md:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
              Hipótesis H0
            </p>
            <h2 className="mt-1 font-display text-2xl tracking-[-0.02em] text-fg">
              Red de vacío tetraédrica
            </h2>
          </div>
          <Button variant="ghost" size="iconSm" onClick={() => setOpen(false)} aria-label="Cerrar axioma">
            <X />
          </Button>
        </div>
        <p className="text-sm leading-normal text-muted">
          El vacío cuántico a escalas subgalácticas se modela como una red discreta
          con coordinación tetraédrica z_fund = 4. Cada nodo se conecta con
          exactamente cuatro vecinos. Esa coordinación maximiza la densidad de
          entropía holográfica entre los sólidos platónicos y queda fijada por el
          Principio Simplicial Mínimo (rigidez de Regge / Cayley–Menger).
        </p>
        <p className="mt-3 text-sm leading-normal text-muted">
          El vacío es, en origen, un campo cuaterniónico sobre ℍ ≅ S³. La física
          en ℝ³ es la proyección π: ℍ → ℝ³ del 5-celda {"{3,3,3}"}. El vértice perdido
          carga ΔS = ln 2 — un bit — y se manifiesta como Ω_DM = 2 ln(3/2)/3 ≈ 0.2703
          sin partículas de materia oscura.
        </p>
        <p className="mt-4 font-mono text-xs leading-relaxed text-subtle">
          TEG · Miguel Ángel Franco León · cadena sin parámetros ajustados
        </p>
      </div>
    </div>
  );
}

function Transport() {
  const playing = useSim((s) => s.playing);
  const toggle = useSim((s) => s.togglePlay);
  const speed = useSim((s) => s.speed);
  const setSpeed = useSim((s) => s.setSpeed);
  const replay = useSim((s) => s.replay);
  const auto = useSim((s) => s.autoCamera);
  const setAuto = useSim((s) => s.setAutoCamera);
  const epochIndex = useSim((s) => s.epochIndex);
  const jump = useSim((s) => s.jumpEpoch);
  const setConstants = useSim((s) => s.setConstantsOpen);
  const setTheory = useSim((s) => s.setTheoryOpen);

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-2">
      <Button
        variant="muted"
        size="icon"
        onClick={toggle}
        aria-label={playing ? "Pausar" : "Reproducir"}
      >
        {playing ? <Pause /> : <Play />}
      </Button>
      <Button
        variant="ghost"
        size="iconSm"
        onClick={() => jump(epochIndex - 1)}
        aria-label="Época anterior"
        disabled={epochIndex === 0}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="ghost"
        size="iconSm"
        onClick={() => jump(epochIndex + 1)}
        aria-label="Época siguiente"
        disabled={epochIndex === EPOCHS.length - 1}
      >
        <ChevronRight />
      </Button>
      <Button variant="ghost" size="iconSm" onClick={replay} aria-label="Reiniciar">
        <RotateCcw />
      </Button>
      <div className="flex rounded-sm border border-border">
        {[0.5, 1, 2].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            className={`h-9 min-w-11 px-2 font-mono text-xs tabular-nums ${
              speed === s ? "bg-fg/10 text-fg" : "text-subtle"
            }`}
          >
            {s}×
          </button>
        ))}
      </div>
      <Button
        variant={auto ? "muted" : "ghost"}
        size="iconSm"
        onClick={() => setAuto(!auto)}
        aria-label={auto ? "Cámara auto" : "Cámara libre"}
      >
        <Camera />
        <span className="hidden md:inline">{auto ? "Cámara auto" : "Cámara libre"}</span>
      </Button>
      <Button variant="outline" size="sm" onClick={() => setConstants(true)}>
        σ
      </Button>
      <Button variant="ghost" size="iconSm" onClick={() => setTheory(true)} aria-label="Axioma">
        <BookOpen />
      </Button>
      <span className="ml-1 hidden font-mono text-xs text-subtle md:inline">
        <TimeReadout />
      </span>
    </div>
  );
}

export function Overlay() {
  const intro = useSim((s) => s.intro);
  const epochIndex = useSim((s) => s.epochIndex);
  const epoch = EPOCHS[epochIndex];
  const showCurve = epochIndex >= 6 && !intro;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const s = useSim.getState();
      if (e.code === "Space") {
        e.preventDefault();
        if (s.intro) s.start();
        else s.togglePlay();
      } else if (e.key === "ArrowRight") s.jumpEpoch(s.epochIndex + 1);
      else if (e.key === "ArrowLeft") s.jumpEpoch(s.epochIndex - 1);
      else if (e.key === "r" || e.key === "R") s.replay();
      else if (e.key === "c" || e.key === "C") s.setAutoCamera(!s.autoCamera);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-fg">
      {intro && <Intro />}
      <TheorySheet />

      {!intro && (
        <>
          <header className="pointer-events-none absolute top-0 right-0 left-0 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:p-6">
            <div className="hud-panel max-w-md rounded-xl p-3 md:p-4">
              <p className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
                {String(epoch.index + 1).padStart(2, "0")} / {String(EPOCHS.length).padStart(2, "0")}
                <span className="hidden md:inline"> · {epoch.kicker}</span>
              </p>
              <h2 className="mt-1 font-display text-lg tracking-[-0.02em] text-fg md:text-2xl">
                {epoch.title}
              </h2>
              <p className="mt-1 font-mono text-xs text-accent">{epoch.formula}</p>
              <p className="mt-2 hidden text-sm leading-normal text-muted md:block">
                {epoch.body}
              </p>
            </div>
          </header>

          <div className="absolute top-3 right-3 flex max-w-[min(100%-1.5rem,20rem)] flex-col items-end gap-3 md:top-6 md:right-6">
            <ConstantsPanel />
            {showCurve && <CurvePanel />}
          </div>

          <div className="absolute right-0 bottom-0 left-0 flex flex-col items-stretch gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:items-center md:gap-3 md:p-5">
            <Transport />
            <Timeline />
            <p className="hidden text-center font-mono text-xs text-subtle md:block">
              Arrastra para orbitar · Espacio pausa · TEG · M. A. Franco León
            </p>
          </div>
        </>
      )}
    </div>
  );
}
