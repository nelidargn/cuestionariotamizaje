import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // <-- NUEVO
import { ScreeningService } from '../../services/screening.service';
import { ScreeningQuestion, ScreeningAnswer, RiskAssessment } from '../../models/screening.model';
import { ResultsComponent } from '../results/results.component';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ResultsComponent], // <-- añade ReactiveFormsModule
  templateUrl: './questionnarie.component.html',
  styleUrls: ['./questionnarie.component.css']
})
export class QuestionnaireComponent implements OnInit {
  questions: ScreeningQuestion[] = [];
  answers: ScreeningAnswer[] = [];
  submitted = false;
  riskAssessment: RiskAssessment | null = null;

  // <-- NUEVO: formulario reactivo de datos personales
  personalForm!: FormGroup;

  constructor(
    private screeningService: ScreeningService,
    private fb: FormBuilder // <-- NUEVO
  ) {}

  ngOnInit(): void {
    this.questions = this.screeningService.getQuestions();
    this.initializeAnswers();

    // <-- NUEVO: inicializar form reactivo
    this.personalForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      sexo: [''],
      fechaNacimiento: [null],
      cp: ['']
    });
  }

  private initializeAnswers(): void {
    this.answers = this.questions.map(q => ({
      questionId: q.id,
      answer: false,
      // NUEVO: para que el template tenga dónde enlazar
      details: q.id === 'tabaquismo'
        ? { smokingYears: undefined, cigsPerDay: undefined }
        : q.id === 'biomasa'
        ? { biomassYears: undefined, biomassHoursPerDay: undefined }
        : {}
    }));
  }

  // helper para acceder al answer desde el template
  getAnswer(id: string) {
    return this.answers.find(a => a.questionId === id);
  }

  // métodos agregados para usar en el template
  isAnswerTrue(questionId: string): boolean {
    return this.answers.find(a => a.questionId === questionId)?.answer === true;
  }

  isAnswerFalse(questionId: string): boolean {
    return this.answers.find(a => a.questionId === questionId)?.answer === false;
  }

  onAnswerChange(questionId: string, answer: boolean): void {
    const answerObj = this.answers.find(a => a.questionId === questionId);
    if (answerObj) {
      answerObj.answer = answer;
    }
  }

  submitQuestionnaire(): void {
    // <-- NUEVO: validar datos personales antes de calcular
    if (this.personalForm && this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      return;
    }

    this.riskAssessment = this.screeningService.calculateRisk(this.answers);
    this.submitted = true;
  }

  private toNumber(v: any): number | undefined {
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

  setSmokingYears(id: string, val: any) {
    const a = this.getAnswer(id);
    if (!a) return;
    a.details = a.details || {};
    a.details.smokingYears = this.toNumber(val);
  }

  setCigsPerDay(id: string, val: any) {
    const a = this.getAnswer(id);
    if (!a) return;
    a.details = a.details || {};
    a.details.cigsPerDay = this.toNumber(val);
  }

  setBiomassYears(id: string, val: any) {
    const a = this.getAnswer(id);
    if (!a) return;
    a.details = a.details || {};
    a.details.biomassYears = this.toNumber(val);
  }

  setBiomassHoursPerDay(id: string, val: any) {
    const a = this.getAnswer(id);
    if (!a) return;
    a.details = a.details || {};
    a.details.biomassHoursPerDay = this.toNumber(val);
  }


  resetForm(): void {
    this.submitted = false;
    this.riskAssessment = null;
    this.initializeAnswers();

    // <-- NUEVO: resetear form reactivo
    if (this.personalForm) {
      this.personalForm.reset({
        nombre: '',
        sexo: '',
        fechaNacimiento: null,
        cp: ''
      });
    }
  }
}
