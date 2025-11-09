import { Component } from '@angular/core';
import { QuestionnaireComponent } from "./pages/questions/questionnarie.component"

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [QuestionnaireComponent],
  template: '<<app-questionnaire></app-questionnaire>',
  styles: []
})
export class AppComponent {
  title = 'Pulmonary Screening Questionnaire';
}