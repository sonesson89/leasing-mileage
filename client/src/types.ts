export type ChargeSession = {
  startDate: string | null;
  endDate: string | null;
  durationMinutes: number | null;
  energyKwh: number | null;
  startBatteryLevel: number | null;
  endBatteryLevel: number | null;
  avgPowerKw: number | null;
};

export type CarLocation = {
  latitude: number;
  longitude: number;
  lastUpdated: string | null;
};

export type ChartPoint = {
  date: string;
  month: number;
  actual: number | null;
  budget: number | null;
  projected: number | null;
};
