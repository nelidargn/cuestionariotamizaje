// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// === C O N F I G ===
const ALLOWED_ORIGINS = [
  "http://localhost:4200",                 // Angular local
  "https://cuestionariotamizajeprod.com",  // producción (ajústalo)
]

// === C O R S  H E L P E R S ===
function corsHeaders(origin: string | null) {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  }
}

function json(payload: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  })
}

// === R E S U L T S  C A L C U L A T I O N ===
// Calcula IT (pack-years) y IB (biomasa) como en tu ScreeningService
function calcIT(cigs?: number, years?: number) {
  if (!cigs || !years) return 0
  return (cigs * years) / 20
}
function calcIB(years?: number, hrs?: number) {
  if (!years || !hrs) return 0
  return years * hrs
}

// Reglas/umbrales (ajusta si cambian tus criterios clínicos)
function computeResultadosFrom(respuestas: any) {
  const it = calcIT(respuestas?.cigsPorDia, respuestas?.aniosFumando)
  const ib = calcIB(respuestas?.aniosBiomasa, respuestas?.horasPorDiaBiomasa)

  const byIT = it >= 20
  const byYears = (respuestas?.aniosFumando ?? 0) >= 20
  const biomasaCumple = ib > 100
  const tabaquismoCumple = byIT || byYears
  const requiresScreening = tabaquismoCumple || biomasaCumple

  return { it, ib, byIT, byYears, biomasaCumple, tabaquismoCumple, requiresScreening }
}

// === H A N D L E R ===
Deno.serve(async (req) => {
  const origin = req.headers.get("origin")

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) })
  }

  if (req.method !== "POST") {
    return json({ error: "Método no permitido" }, 405, origin)
  }

  try {
    const body = await req.json()

    // 1) Validaciones mínimas
    const { identificacion, respuestas, resultados: resultadosFront } = body ?? {}
    if (!identificacion?.nombre || typeof identificacion?.nombre !== "string") {
      return json({ error: "Nombre requerido" }, 400, origin)
    }

    // 2) Cliente server-side con service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !serviceKey) {
      return json({ error: "Faltan variables de entorno del servidor" }, 500, origin)
    }

    const { createClient } = await import("npm:@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, serviceKey)

    // 3) Recalcular SIEMPRE resultados en servidor (verdad canónica)
    const srv = computeResultadosFrom(respuestas ?? {})
    const resultadosToStore = {
      ...resultadosFront,                     // (opcional) conservas lo que envió el front
      packYears: srv.it,
      indiceExposicion: srv.ib,
      tabaquismoByIT: srv.byIT,
      tabaquismoByYears: srv.byYears,
      biomasaCumple: srv.biomasaCumple,
      requiresScreening: srv.requiresScreening,
      tabaquismoCumple: srv.tabaquismoCumple,
      biomasa_cumple: srv.biomasaCumple,
    }

    // 4) Insert respondent
    const { data: respondent, error: err1 } = await supabase
      .from("respondents")
      .insert({
        nombre: identificacion?.nombre ?? null,
        sexo: identificacion?.sexo ?? null,
        fecha_nacimiento: identificacion?.fechaNacimiento ?? null,
        telefono: identificacion?.telefono ?? null,
        email: identificacion?.email ?? null,
        cp: identificacion?.cp ?? null,
        medico: identificacion?.medico ?? null,
      })
      .select("*")
      .single()

    if (err1) return json({ error: err1.message }, 400, origin)

    // 5) Insert screening (usa valores del servidor)
    const { data: screening, error: err2 } = await supabase
      .from("screenings")
      .insert({
        respondent_id: respondent.id,
        respuestas: respuestas ?? {},
        resultados: resultadosToStore,
        pack_years: srv.it,
        exposicion_ib: srv.ib,
        tabaquismo_cumple: srv.tabaquismoCumple,
        biomasa_cumple: srv.biomasaCumple,
      })
      .select("*")
      .single()

    if (err2) return json({ error: err2.message }, 400, origin)

    return json({ ok: true, respondent, screening }, 201, origin)
  } catch (e) {
    return json({ error: e?.message ?? "Error inesperado" }, 500, origin)
  }
})
