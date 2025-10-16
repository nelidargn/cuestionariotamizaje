import type { Routes } from "@angular/router"
import { WelcomeComponent } from "./pages/welcome/welcome.component"
import { QuestionsComponent } from "./pages/questions/questions.component"
import { ResultsComponent } from "./pages/results/results.component"

export const routes: Routes = [
  { path: "", component: WelcomeComponent },
  { path: "questions", component: QuestionsComponent },
  { path: "results", component: ResultsComponent },
  { path: "**", redirectTo: "" },
]
