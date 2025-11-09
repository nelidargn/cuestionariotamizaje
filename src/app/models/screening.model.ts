export interface ScreeningQuestion {
  id: string;
  question: string;
  explanation: string;
  points: number;
  type: 'yes-no' | 'radio';
}

export interface ScreeningAnswer {
  questionId: string;
  answer: boolean;
  // NUEVO: detalles por pregunta (opcional)
  details?: {
    // tabaquismo
    smokingYears?: number;
    cigsPerDay?: number;
    // biomasa
    biomassYears?: number;
    biomassHoursPerDay?: number;
  };
}

export interface RiskAssessment {
  totalPoints: number;
  riskLevel: 'low' | 'moderate' | 'high';
  recommendation: string;
  requiresContact: boolean;
}

export interface ContactInfo {
  email: string;
  phone: string;
}

