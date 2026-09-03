import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSim } from "@/sim/store";

export function Intro() {
  const start = useSim((s) => s.start);
  const openTheory = useSim((s) => s.setTheoryOpen);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end md:justify-center">
      <div className="pointer-events-auto mx-auto w-full max-w-xl px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10 md:px-8">
        <p className="mb-3 font-mono text-xs font-medium tracking-[0.22em] text-muted uppercase">
          Tetrahedral Emergent Gravity
        </p>
        <h1 className="font-display text-3xl leading-[1.05] tracking-[-0.03em] text-fg">
          Génesis tetraédrica
        </h1>
        <p className="mt-4 max-w-md text-sm leading-normal text-muted md:text-base">
          El vacío cuántico elige el 3-símplice. De esa coordinación — z_fund = 4 —
          emergen el espacio, la masa y lo que el cosmos llama materia oscura.
        </p>
        <p className="mt-3 font-mono text-xs text-subtle">
          Hipótesis TEG · Miguel Ángel Franco León
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button onClick={start} className="min-w-44">
            Iniciar simulación
            <ArrowRight />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              start();
              openTheory(true);
            }}
          >
            Leer el axioma
          </Button>
        </div>
      </div>
    </div>
  );
}
