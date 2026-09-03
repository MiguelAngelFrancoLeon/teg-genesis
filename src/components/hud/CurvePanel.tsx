import { useMemo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { rotationCurve } from "@/sim/constants";

export function CurvePanel() {
  const data = useMemo(() => rotationCurve(36), []);

  return (
    <div className="hud-panel pointer-events-auto hidden w-[min(100%,20rem)] rounded-xl p-4 md:block">
      <p className="font-mono text-[0.65rem] tracking-[0.16em] text-muted uppercase">
        Curva de rotación
      </p>
      <p className="mt-1 text-sm text-fg">V(r) = √(V_bar² + V_vac²)</p>
      <div className="mt-2 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
            <XAxis
              dataKey="r"
              tick={{ fill: "#9a9a94", fontSize: 10 }}
              axisLine={{ stroke: "rgba(236,236,232,0.12)" }}
              tickLine={false}
              unit=" kpc"
            />
            <YAxis
              tick={{ fill: "#9a9a94", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#111318",
                border: "1px solid rgba(236,236,232,0.12)",
                borderRadius: 8,
                fontSize: 12,
                color: "#ecece8",
              }}
              formatter={(value, name) => [
                `${Number(value).toFixed(0)} km/s`,
                name === "vTot" ? "Total" : name === "vBar" ? "Bariónica" : "Vacío",
              ]}
              labelFormatter={(l) => `r = ${l} kpc`}
            />
            <Line type="monotone" dataKey="vBar" stroke="#6e6e68" strokeWidth={1} dot={false} />
            <Line type="monotone" dataKey="vVac" stroke="#9a9a94" strokeWidth={1} dot={false} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="vTot" stroke="#c8d0d8" strokeWidth={1.6} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 font-mono text-[0.65rem] leading-snug text-subtle">
        Disco exponencial esquemático + M_vac ∝ ln 2 · (r/r_max)³
      </p>
    </div>
  );
}
