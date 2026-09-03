import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { Overlay } from "@/components/hud/Overlay";

const TegCanvas = lazy(() =>
  import("@/sim/TegCanvas").then((m) => ({ default: m.TegCanvas })),
);

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      {mounted ? (
        <Suspense fallback={<div className="absolute inset-0 bg-bg" />}>
          <TegCanvas />
        </Suspense>
      ) : (
        <div className="absolute inset-0 bg-bg" />
      )}
      <Overlay />
    </main>
  );
}
