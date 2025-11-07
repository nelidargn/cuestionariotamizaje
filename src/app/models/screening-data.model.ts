export interface ScreeningData {
  // Identificación
  nombre: string
  sexo: "F" | "M" | "Otro" | ""
  fechaNacimiento: string
  edad: number
  telefono: string
  email: string
  cp: string
  medico: string

  // Tabaquismo
  fumaOFumo: boolean
  aniosFumando: number
  cigsPorDia: number

  // Biomasa
  expBiomasa: boolean
  aniosBiomasa: number
  horasPorDiaBiomasa: number
}

export interface ScreeningResults {
  it: number // Índice tabáquico
  ib: number // Índice biomasa
  tabaquismoCumple: boolean
  tabaquismoByIT: boolean
  tabaquismoByYears: boolean
  biomasaCumple: boolean
  requiresScreening: boolean
}
