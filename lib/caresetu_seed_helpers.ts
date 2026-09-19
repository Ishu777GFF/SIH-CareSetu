// Framework-neutral helpers for the CareSetu demo seed.
// Keep this module in Demo mode only; replace with server-side queries for real deployment.

export type Measurement = {
  date: string;
  heightCm?: number;
  weightKg?: number;
  systolicMmhg?: number;
  diastolicMmhg?: number;
  pulseBpm?: number;
  temperatureC?: number;
  oxygenSaturationPercent?: number;
  source: 'patient-reported' | 'staff-measured' | 'device';
};

export function calculateBmi(heightCm?: number, weightKg?: number): number | null {
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg) || !heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  return Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10;
}

export function latestBmi(measurements: Measurement[]): number | null {
  const latest = [...measurements]
    .filter((m) => Number.isFinite(m.heightCm) && Number.isFinite(m.weightKg) && (m.heightCm ?? 0) > 0 && (m.weightKg ?? 0) > 0)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return latest ? calculateBmi(latest.heightCm, latest.weightKg) : null;
}

export type CaseReadiness = {
  symptoms: boolean;
  measurements: boolean;
  medicinesAndAllergies: boolean;
  reports: boolean;
};

/** A completion/readiness bar—not a health or disease score. */
export function caseReadinessPercent(state: CaseReadiness): number {
  const completed = Object.values(state).filter(Boolean).length;
  return Math.round((completed / Object.keys(state).length) * 100);
}

export function bmiCategory(bmi: number | null, ageYears: number): string | null {
  if (bmi === null || ageYears < 20) return null;
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy weight';
  if (bmi < 30) return 'Overweight';
  return 'Obesity';
}
