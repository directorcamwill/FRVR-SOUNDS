"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { SyncScore } from "@/types/song";

interface ScoreRadarChartProps {
  score: SyncScore;
}

export function ScoreRadarChart({ score }: ScoreRadarChartProps) {
  const data = [
    { dimension: "Arrangement", value: score.arrangement_score, fullMark: 100 },
    { dimension: "Production", value: score.production_score, fullMark: 100 },
    { dimension: "Mix", value: score.mix_score, fullMark: 100 },
    { dimension: "Usability", value: score.usability_score, fullMark: 100 },
    { dimension: "Market Fit", value: score.market_fit_score, fullMark: 100 },
    { dimension: "Brand Safety", value: score.brand_safety_score, fullMark: 100 },
    { dimension: "Deliverables", value: score.deliverables_score, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#333" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "#A3A3A3", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#555", fontSize: 10 }}
          axisLine={false}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#E87420"
          fill="#E87420"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
