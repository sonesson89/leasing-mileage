import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styled from "styled-components";
import type { ChartPoint } from "../types";

const Card = styled.div`
  padding: 2em;
  width: 100%;
  max-width: 800px;
  min-width: 0;
  margin: 0 auto;
  overflow: hidden;

  h3 {
    margin-bottom: 1em;
  }
`;

type MileageProjectionChartProps = {
  chartData: ChartPoint[];
  todayChartLabel?: string;
  showBudgetLine: boolean;
};

export default function MileageProjectionChart({
  chartData,
  todayChartLabel,
  showBudgetLine,
}: MileageProjectionChartProps) {
  if (chartData.length === 0) return null;

  return (
    <Card>
      <h3>Mileage Over Time (with future projected mileage)</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            interval={"preserveStartEnd"}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{ value: "mil", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1a1a",
              border: "1px solid #444",
              borderRadius: 8,
            }}
            formatter={(value) => [`${Number(value).toFixed(1)} mil`]}
          />
          <Legend />
          {todayChartLabel && (
            <ReferenceLine
              x={todayChartLabel}
              stroke="#efdf24"
              strokeWidth={2}
              label={{
                value: "Today",
                position: "insideTopRight",
                fill: "#efdf24",
                fontSize: 12,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#646cff"
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="projected"
            name="Projected"
            stroke="#646cff"
            strokeWidth={2}
            strokeDasharray="8 4"
            dot={false}
            connectNulls={false}
          />
          {showBudgetLine && (
            <Line
              type="monotone"
              dataKey="budget"
              name="Contract limit"
              stroke="#f5a623"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
