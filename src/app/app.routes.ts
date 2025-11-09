import { Routes } from "@angular/router"
import { WelcomeComponent } from "./pages/welcome/welcome.component"
import { QuestionnaireComponent } from "./pages/questions/questionnarie.component"
import { ResultsComponent } from "./pages/results/results.component"

export const routes: Routes = [
  { path: "", component: WelcomeComponent },
  { path: "questions", component: QuestionnaireComponent },
  { path: "results", component: ResultsComponent },
  { path: "**", redirectTo: "" },
]
