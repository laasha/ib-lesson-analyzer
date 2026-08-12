export interface PresetTranscript {
  id: string;
  title: { ka: string; en: string };
  subject: { ka: string; en: string };
  program: "PYP" | "MYP" | "DP" | "ზოგადი";
  description: { ka: string; en: string };
  content: { ka: string; en: string };
}

export interface AnalysisRequest {
  transcript?: string;
  generalText?: string;
  positiveNotes?: string[];
  negativeNotes?: string[];
  language?: "ka" | "en";
  program: string;
  subject: string;
  selectedRubrics?: string[];
}

export interface AnalysisResponse {
  result: string;
  error?: string;
}
