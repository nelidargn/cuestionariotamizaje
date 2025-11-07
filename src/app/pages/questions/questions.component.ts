import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { NonNullableFormBuilder, ReactiveFormsModule, Validators, type FormGroup } from "@angular/forms"
import { Router } from "@angular/router"
import { ScreeningService } from "../../services/screening.service"
import type { ScreeningData } from "../../models/screening-data.model"
import { ApiService } from "../../services/api.service" // <-- NUEVO

@Component({
  selector: "app-questions",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./questions.component.html",
  styleUrls: ["./questions.component.css"],
})
export class QuestionsComponent {
  form!: FormGroup
  saving = false // <-- NUEVO

  constructor(
    private fb: NonNullableFormBuilder,
    private router: Router,
    private screeningService: ScreeningService,
    private api: ApiService, // <-- NUEVO
  ) {
    this.form = this.fb.group({
      nombre: this.fb.control("", { validators: [Validators.required, Validators.minLength(2)] }),
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

  // 1) Calcula y guarda en el servicio (ya lo haces):
  this.screeningService.setScreeningData(data)

  // 2) Lee resultados calculados (signal -> invocar como función):
  const results = this.screeningService.getScreeningResults()
  // results: ScreeningResults | null

  // Seguridad: si por alguna razón es null, re-calculamos rápido:
  const safe = results ?? {
    it: 0,
    ib: 0,
    tabaquismoCumple: false,
    tabaquismoByIT: false,
    tabaquismoByYears: false,
    biomasaCumple: false,
    requiresScreening: false,
  }

  // 3) Armar payload final
  const payload = {
    identificacion: {
      nombre: data.nombre,
      sexo: data.sexo,
      fechaNacimiento: data.fechaNacimiento,
      telefono: data.telefono,
      email: data.email,
      cp: data.cp,
      medico: data.medico,
    },
    respuestas: data,
    resultados: {
      packYears: safe.it,
      indiceExposicion: safe.ib,
      tabaquismoByIT: safe.tabaquismoByIT,
      tabaquismoByYears: safe.tabaquismoByYears,
      biomasaCumple: safe.biomasaCumple,
      requiresScreening: safe.requiresScreening,
      tabaquismoCumple: safe.tabaquismoCumple,
    },
    // columnas derivadas para consultas rápidas:
    pack_years: safe.it,
    exposicion_ib: safe.ib,
    tabaquismo_cumple: safe.tabaquismoCumple,
  }

  this.saving = true
  this.api.submitScreening(payload).subscribe({
    next: () => {
      this.saving = false
      this.router.navigate(["/results"])
    },
    error: (err: unknown) => {
      this.saving = false
      console.error("Error al guardar en Supabase:", err)
      this.router.navigate(["/results"])
    },
  })
}

  goBack() {
    this.router.navigate(["/"])
  }
}
