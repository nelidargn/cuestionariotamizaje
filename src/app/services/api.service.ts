// src/app/services/api.service.ts
import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"

@Injectable({ providedIn: "root" })
export class ApiService {
  // Pega aquí TU URL real de la función:
  private fnUrl = "  https://cjqwkfridxxzkwczlnkb.functions.supabase.co/submit-screening"

  constructor(private http: HttpClient) {}

  submitScreening(payload: any): Observable<any> {
    return this.http.post(this.fnUrl, payload, {
      headers: { "Content-Type": "application/json" },
    })
  }
}
