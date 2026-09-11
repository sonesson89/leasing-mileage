import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import moment from "moment";
import styled from "styled-components";
import type { ChargeSession } from "../types";

const FAST_CHARGE_THRESHOLD_KW = 10;
const HOME_CHARGE_COLOR = "#646cff";
const FAST_CHARGE_COLOR = "#f5a623";
const UNKNOWN_CHARGE_COLOR = "#888";

// Alternating shades so same-day, same-type bars remain visually distinguishable without hovering
const HOME_CHARGE_COLORS = ["#646cff", "#8f95ff", "#4b52cc", "#aeb2ff", "#363c99"];
const FAST_CHARGE_COLORS = ["#f5a623", "#ffc561", "#c9820f", "#ffdb9e", "#96660b"];

function isFastCharge(avgPowerKw: number | null): boolean | null {
  return avgPowerKw === null ? null : avgPowerKw > FAST_CHARGE_THRESHOLD_KW;
}

function getChargeColor(avgPowerKw: number | null, typeIndex: number): string {
  const fast = isFastCharge(avgPowerKw);
  if (fast === null) return UNKNOWN_CHARGE_COLOR;
  const palette = fast ? FAST_CHARGE_COLORS : HOME_CHARGE_COLORS;
  return palette[typeIndex % palette.length];
}

function getChargeTypeLabel(avgPowerKw: number | null): string {
  const fast = isFastCharge(avgPowerKw);
  if (fast === null) return "Unknown";
  return fast ? "Fast charging (station)" : "Home charging (slow)";
}

const Card = styled.div`
  padding: 2em;
  width: 100%;
  min-width: 0;
  overflow-x: auto;

  h3 {
    margin-bottom: 1em;
  }
`;

const ChargeTooltip = styled.div`
  padding: 0.6em 0.8em;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #ddd;

  p {
    margin: 0.2em 0;
  }
`;

const ChargeTooltipRange = styled.p`
  color: #fff;
  font-weight: 600;
`;

const ChargeTooltipFloating = styled.div`
  position: fixed;
  z-index: 1000;
  pointer-events: none;
`;

const ChargeLegend = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #ccc;
`;

const ChargeLegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
`;

const ChargeLegendSwatch = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
`;

function ChargeSessionTooltipContent({ meta }: { meta: ChargeSession }) {
  return (
    <ChargeTooltip>
      <ChargeTooltipRange>
        {meta.startDate
          ? moment(meta.startDate).format("D MMM YYYY HH:mm")
          : "—"}
        {" → "}
        {meta.endDate ? moment(meta.endDate).format("D MMM YYYY HH:mm") : "—"}
      </ChargeTooltipRange>
      <p>{getChargeTypeLabel(meta.avgPowerKw)}</p>
      <p>
        Duration:{" "}
        {meta.durationMinutes !== null
          ? moment
              .utc(meta.durationMinutes * 60 * 1000)
              .format("HH [hours] mm [minutes]")
          : "—"}
      </p>
      <p>
        Avg. speed:{" "}
        {meta.avgPowerKw !== null
          ? `${meta.avgPowerKw.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} kW`
          : "—"}
      </p>
      <p>
        Energy:{" "}
        {meta.energyKwh !== null
          ? `${meta.energyKwh.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} kWh`
          : "—"}
      </p>
      <p>
        Battery:{" "}
        {meta.startBatteryLevel !== null && meta.endBatteryLevel !== null
          ? `${meta.startBatteryLevel}% → ${meta.endBatteryLevel}%`
          : "—"}
      </p>
    </ChargeTooltip>
  );
}

type ChargeHistoryChartProps = {
  chargeSessions: ChargeSession[] | null;
};

export default function ChargeHistoryChart({
  chargeSessions,
}: ChargeHistoryChartProps) {
  const [chargeTooltipMeta, setChargeTooltipMeta] =
    useState<ChargeSession | null>(null);
  const chargeTooltipRef = useRef<HTMLDivElement>(null);
  const chargeTooltipPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Apply the last known cursor position as soon as the tooltip mounts, avoiding a flash at (0, 0)
    if (chargeTooltipMeta && chargeTooltipRef.current) {
      chargeTooltipRef.current.style.left = `${chargeTooltipPos.current.x}px`;
      chargeTooltipRef.current.style.top = `${chargeTooltipPos.current.y}px`;
    }
  }, [chargeTooltipMeta]);

  const { chargeChartData, chargeSessionSlotCount } = useMemo(() => {
    if (!chargeSessions || chargeSessions.length === 0) {
      return { chargeChartData: [], chargeSessionSlotCount: 0 };
    }

    // Group sessions by the date they started on (overnight sessions stay on the start date)
    const byDate = new Map<string, ChargeSession[]>();
    let earliest = moment();
    for (const session of chargeSessions) {
      if (!session.startDate) continue;
      const day = moment(session.startDate).startOf("day");
      const dateKey = day.format("YYYY-MM-DD");
      const bucket = byDate.get(dateKey) ?? [];
      bucket.push(session);
      byDate.set(dateKey, bucket);
      if (day.isBefore(earliest)) earliest = day;
    }

    let maxSlots = 0;
    const rows: Record<string, unknown>[] = [];
    const today = moment().startOf("day");
    for (
      const cursor = earliest.clone();
      cursor.isSameOrBefore(today);
      cursor.add(1, "day")
    ) {
      const dateKey = cursor.format("YYYY-MM-DD");
      const row: Record<string, unknown> = {
        date: cursor.format("D MMM"),
        dateKey,
      };

      // Leave the date blank (no bars) when there were no charge sessions that day
      const sessions = byDate.get(dateKey);
      if (sessions) {
        const sorted = [...sessions].sort((a, b) =>
          (a.startDate ?? "").localeCompare(b.startDate ?? ""),
        );
        maxSlots = Math.max(maxSlots, sorted.length);
        // Count occurrences per charge type so same-type bars on the same day get alternating shades
        const typeCounts: Record<string, number> = {};
        sorted.forEach((session, index) => {
          const fast = isFastCharge(session.avgPowerKw);
          const typeKey = fast === null ? "unknown" : fast ? "fast" : "home";
          const typeIndex = typeCounts[typeKey] ?? 0;
          typeCounts[typeKey] = typeIndex + 1;

          row[`session${index}`] = session.energyKwh ?? undefined;
          row[`session${index}Meta`] = session;
          row[`session${index}TypeIndex`] = typeIndex;
        });
      }

      rows.push(row);
    }

    return { chargeChartData: rows, chargeSessionSlotCount: maxSlots };
  }, [chargeSessions]);

  if (chargeChartData.length === 0) return null;

  return (
    <Card>
      <h3>Charging History (last 90 days)</h3>
      <ResponsiveContainer width="100%" height={550}>
        <BarChart
          data={chargeChartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{ value: "kWh", angle: -90, position: "insideLeft" }}
          />
          {Array.from({ length: chargeSessionSlotCount }).map((_, i) => {
            const metaKey = `session${i}Meta`;
            return (
              <Bar
                key={i}
                dataKey={`session${i}`}
                stackId="charges"
                radius={
                  i === chargeSessionSlotCount - 1 ? [4, 4, 0, 0] : undefined
                }
                onMouseEnter={(
                  data: { payload?: Record<string, unknown> },
                  _index: number,
                  event: React.MouseEvent,
                ) => {
                  const meta = data?.payload?.[metaKey] as
                    | ChargeSession
                    | undefined;
                  if (meta) {
                    chargeTooltipPos.current = {
                      x: event.clientX + 16,
                      y: event.clientY + 16,
                    };
                    setChargeTooltipMeta(meta);
                    if (chargeTooltipRef.current) {
                      chargeTooltipRef.current.style.left = `${chargeTooltipPos.current.x}px`;
                      chargeTooltipRef.current.style.top = `${chargeTooltipPos.current.y}px`;
                    }
                  }
                }}
                onMouseMove={(
                  _data: unknown,
                  _index: number,
                  event: React.MouseEvent,
                ) => {
                  // Move the tooltip via a direct DOM write, skipping React re-renders on every pixel
                  chargeTooltipPos.current = {
                    x: event.clientX + 16,
                    y: event.clientY + 16,
                  };
                  if (chargeTooltipRef.current) {
                    chargeTooltipRef.current.style.left = `${chargeTooltipPos.current.x}px`;
                    chargeTooltipRef.current.style.top = `${chargeTooltipPos.current.y}px`;
                  }
                }}
                onMouseLeave={() => setChargeTooltipMeta(null)}
              >
                {chargeChartData.map((row, rowIndex) => {
                  const meta = row[metaKey] as ChargeSession | undefined;
                  const typeIndex =
                    (row[`session${i}TypeIndex`] as number | undefined) ?? 0;
                  return (
                    <Cell
                      key={rowIndex}
                      fill={
                        meta
                          ? getChargeColor(meta.avgPowerKw, typeIndex)
                          : "transparent"
                      }
                    />
                  );
                })}
              </Bar>
            );
          })}
        </BarChart>
      </ResponsiveContainer>
      <ChargeLegend>
        <ChargeLegendItem>
          <ChargeLegendSwatch style={{ background: HOME_CHARGE_COLOR }} />
          Home charging (≤{FAST_CHARGE_THRESHOLD_KW} kW)
        </ChargeLegendItem>
        <ChargeLegendItem>
          <ChargeLegendSwatch style={{ background: FAST_CHARGE_COLOR }} />
          Fast charging (&gt;{FAST_CHARGE_THRESHOLD_KW} kW)
        </ChargeLegendItem>
      </ChargeLegend>
      {chargeTooltipMeta && (
        <ChargeTooltipFloating ref={chargeTooltipRef}>
          <ChargeSessionTooltipContent meta={chargeTooltipMeta} />
        </ChargeTooltipFloating>
      )}
    </Card>
  );
}
