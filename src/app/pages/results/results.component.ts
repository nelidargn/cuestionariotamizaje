import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { Router } from "@angular/router"
import { ScreeningService } from "../../services/screening.service"
import type { ScreeningData, ScreeningResults } from "../../models/screening-data.model"

@Component({
  selector: "app-results",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./results.component.html",
  styleUrls: ["./results.component.css"],
})
export class ResultsComponent implements OnInit {
  data: ScreeningData | null = null
  results: ScreeningResults | null = null

  constructor(
    private router: Router,
    private screeningService: ScreeningService,
  ) {}

  ngOnInit() {
    this.data = this.screeningService.getScreeningData()
    this.results = this.screeningService.getScreeningResults()

    if (!this.data || !this.results) {
      this.router.navigate(["/"])
    }
  }

  fmt(n: number, decimals = 1): string {
    return Number.isFinite(n) ? n.toFixed(decimals) : "0"
  }

  startOver() {
    this.screeningService.reset()
    this.router.navigate(["/"])
  }

  print() {
    window.print()
  }
}
