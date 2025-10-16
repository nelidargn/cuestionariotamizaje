import { Injectable, signal } from "@angular/core"
import type { ScreeningData, ScreeningResults } from "../models/screening-data.model"

@Injectable({
  providedIn: "root",
})
export class ScreeningService {
  private screeningData = signal<ScreeningData | null>(null)
  private screeningResults = signal<ScreeningResults | null>(null)

  setScreeningData(data: ScreeningData) {
    this.screeningData.set(data)
    this.calculateResults(data)
  }

  getScreeningData() {
    return this.screeningData()
  }

  getScreeningResults() {
    return this.screeningResults()
  }

  private calculateResults(data: ScreeningData) {
    const it = this.calcIT(data.cigsPorDia, data.aniosFumando)
    const ib = this.calcIB(data.aniosBiomasa, data.horasPorDiaBiomasa)

    const byIT = it >= 20
    const byYears = data.aniosFumando >= 20
    const tabaquismoCumple = byIT || byYears
    const biomasaCumple = ib > 100

    this.screeningResults.set({
      it,
      ib,
      tabaquismoCumple,
      tabaquismoByIT: byIT,
      tabaquismoByYears: byYears,
      biomasaCumple,
      requiresScreening: tabaquismoCumple || biomasaCumple,
    })
  }

  private calcIT(cigs: number, years: number): number {
    if (!cigs || !years) return 0
    return (cigs * years) / 20
  }

  private calcIB(years: number, hrs: number): number {
    if (!years || !hrs) return 0
    return years * hrs
  }

  reset() {
    this.screeningData.set(null)
    this.screeningResults.set(null)
  }
}
