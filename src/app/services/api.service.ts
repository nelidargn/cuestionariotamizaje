// src/app/services/api.service.ts
import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"
import { environment } from "../../environments/environment"

@Injectable({ providedIn: "root" })
export class ApiService {
  // Pega aquí TU URL real de la función:
  private fnUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  submitScreening(payload: any): Observable<any> {
    return this.http.post(this.fnUrl, payload, {
      headers: { "Content-Type": "application/json" },
    })
  }
}