import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { NonNullableFormBuilder, ReactiveFormsModule, Validators, type FormGroup } from "@angular/forms"
import { Router } from "@angular/router"
import { ScreeningService } from "../../services/screening.service"
import type { ScreeningData } from "../../models/screening-data.model"

@Component({
  selector: "app-questions",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./questions.component.html",
  styleUrls: ["./questions.component.css"],
})
export class QuestionsComponent {
  form!: FormGroup

  constructor(
    private fb: NonNullableFormBuilder,
    private router: Router,
    private screeningService: ScreeningService,
  ) {
    this.form = this.fb.group({
      nombre: this.fb.control("", { validators: [Validators.required, Validators.minLength(2)] }),
      curp: this.fb.control(""),
      sexo: this.fb.control<"F" | "M" | "Otro" | "">(""),
      fechaNacimiento: this.fb.control(""),
      edad: this.fb.control(0, { validators: [Validators.min(0), Validators.max(120)] }),
      telefono: this.fb.control(""),
      email: this.fb.control("", { validators: [Validators.email] }),
      cp: this.fb.control(""),
      medico: this.fb.control(""),
      fumaOFumo: this.fb.control(false),
      aniosFumando: this.fb.control(0, { validators: [Validators.min(0), Validators.max(80)] }),
      cigsPorDia: this.fb.control(0, { validators: [Validators.min(0), Validators.max(100)] }),
      expBiomasa: this.fb.control(false),
      aniosBiomasa: this.fb.control(0, { validators: [Validators.min(0), Validators.max(80)] }),
      horasPorDiaBiomasa: this.fb.control(0, { validators: [Validators.min(0), Validators.max(24)] }),
    })
  }

  get f() {
    return (this.form as any).controls
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    const data = this.form.getRawValue() as ScreeningData
    this.screeningService.setScreeningData(data)
    this.router.navigate(["/results"])
  }

  goBack() {
    this.router.navigate(["/"])
  }
}
