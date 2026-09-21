import type { Patient, Report } from "./medi-data";

export type OcrIssue = { kind: "unclear" | "dose" | "date" | "patient" | "duplicate" | "allergy"; label: string; detail: string };
export const ocrConfidenceLabel = (value?: number) => value === undefined ? "Unclear" : value >= 90 ? "High" : value >= 70 ? "Needs Review" : "Unclear";
export function detectOcrIssues(report: Report, patient: Patient, allReports: Report[], allergies = ""): OcrIssue[] {
  const text = (report.extracted || "").toLowerCase();
  const issues: OcrIssue[] = [];
  if (!report.extracted) return [{ kind: "unclear", label: "No extracted content", detail: "The original source is preserved; no facts were inferred from this file." }];
  if (ocrConfidenceLabel(report.ocrConfidence) !== "High" || /unclear|illegible|\?\?/.test(text)) issues.push({ kind: "unclear", label: "Unclear text", detail: "One or more extracted words may need comparison with the original source." });
  if (/tablet|capsule|medicine|mg|ml/.test(text) && !/\b\d+(?:\.\d+)?\s*(?:mg|ml)\b/.test(text)) issues.push({ kind: "dose", label: "Medicine dose needs review", detail: "A medicine-related phrase was found without a clear dose." });
  if (!/\b20\d{2}\b|\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/.test(text)) issues.push({ kind: "date", label: "Document date needs review", detail: "No clear date was found in the extracted text." });
  const patientLine = text.match(/patient\s*:\s*([^\n.]+)/)?.[1];
  if (patientLine && !patientLine.includes(patient.name.toLowerCase())) issues.push({ kind: "patient", label: "Patient name mismatch", detail: "The extracted patient name does not match this CareSetu patient." });
  const normalized = text.replace(/\s+/g, " ");
  if (allReports.some(other => other.id !== report.id && other.extracted && other.extracted.toLowerCase().replace(/\s+/g, " ") === normalized)) issues.push({ kind: "duplicate", label: "Possible duplicate document", detail: "Another linked report has matching extracted text." });
  if (/penicillin|amoxicillin/.test(allergies.toLowerCase()) && /amoxicillin|penicillin/.test(text)) issues.push({ kind: "allergy", label: "Possible allergy/medicine conflict", detail: "A medicine-related term may conflict with the recorded allergy history." });
  return issues;
}
