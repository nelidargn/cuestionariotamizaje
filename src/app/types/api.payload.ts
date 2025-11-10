// src/app/types/api-payload.ts
import { PersonalInfo, RiskAssessment } from '../models/screening.model';

export interface ApiPayload {
  identificacion: PersonalInfo;
  respuestas: {
    familiarCaPulmon: boolean;
    tosTresMeses: boolean;
    tosConSangre: boolean;
    perdidaPesoInexplicable: boolean;
    expoRadon: boolean;
    contaminacionAlta?: boolean;

    fumaOFumo: boolean;
    aniosFumando: number;
    cigsPorDia: number;
    expBiomasa: boolean;
    aniosBiomasa: number;
    horasPorDiaBiomasa: number;
  };
  resultados: RiskAssessment & { it?: number; ib?: number };
}
