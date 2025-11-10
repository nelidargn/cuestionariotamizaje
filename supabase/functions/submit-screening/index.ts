// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const ALLOWED_ORIGINS = [
  "http://localhost:4200",                 // Angular local
  "https://cuestionariotamizajeprod.com",  // producción (ajústalo)

];

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
function json(payload: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } });
}

function toNum(x: any) { const n = Number(x); return Number.isFinite(n) ? n : 0; }
function parseDobMaybe(ddmmaaaa?: string | null): string | null {
  if (!ddmmaaaa) return null;
  const m = ddmmaaaa.match(/^(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/(\d{4})$/);
  if (!m) return ddmmaaaa; // quizá ya viene YYYY-MM-DD
  const dd = m[1].padStart(2,"0"), mm = m[2].padStart(2,"0"), yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
}
function calcIT(cigs?: any, years?: any) {
  const c = toNum(cigs), y = toNum(years);
  if (!c || !y) return 0;
  return (c * y) / 20;
}
function calcIB(years?: any, hrs?: any) {
  const y = toNum(years), h = toNum(hrs);
  if (!y || !h) return 0;
  return y * h;
}
function computeResultadosFrom(respuestas: any) {
  const it = calcIT(respuestas?.cigsPorDia, respuestas?.aniosFumando);
  const ib = calcIB(respuestas?.aniosBiomasa, respuestas?.horasPorDiaBiomasa);
  const byIT = it >= 20;
  const byYears = (toNum(respuestas?.aniosFumando) >= 20);
  const biomasaCumple = ib > 100;
  const tabaquismoCumple = byIT || byYears;

  // Nuevas preguntas
  const redFlags = !!respuestas?.tosConSangre || !!respuestas?.tosTresMeses || !!respuestas?.perdidaPesoInexplicable;
  const riesgoAmbiental = !!respuestas?.expoRadon;
  const antecedenteFam = !!respuestas?.familiarCaPulmon;

  const requiresScreening =
    tabaquismoCumple || biomasaCumple || redFlags || riesgoAmbiental || antecedenteFam;

  return { it, ib, byIT, byYears, biomasaCumple, tabaquismoCumple, requiresScreening };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST")    return json({ error: "Método no permitido" }, 405, origin);

  try {
    const body = await req.json();
    const { identificacion, respuestas, resultados: resultadosFront } = body ?? {};
    if (identificacion && typeof identificacion !== "object") {
      return json({ error: "Identificación inválida" }, 400, origin);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "Faltan variables de entorno del servidor" }, 500, origin);

    const { createClient } = await import("npm:@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceKey);

    const srv = computeResultadosFrom(respuestas ?? {});
    const resultadosToStore = {
      ...resultadosFront,
      packYears: srv.it,
      indiceExposicion: srv.ib,
      tabaquismoByIT: srv.byIT,
      tabaquismoByYears: srv.byYears,
      biomasaCumple: srv.biomasaCumple,
      requiresScreening: srv.requiresScreening,
      tabaquismoCumple: srv.tabaquismoCumple,
    };

    const { data: respondent, error: err1 } = await supabase
      .from("respondents")
      .insert({
        sexo: identificacion?.sexo ?? '',
        fecha_nacimiento: parseDobMaybe(identificacion?.fechaNacimiento) ?? null,
        cp: identificacion?.cp ?? null,
        medico: identificacion?.medico ?? null,
        // PII queda null en este flujo
        nombre: identificacion?.nombre ?? null,
        telefono: identificacion?.telefono ?? null,
        email: identificacion?.email ?? null
      })
      .select("*")
      .single();
    if (err1) return json({ error: err1.message }, 400, origin);

    const { data: screening, error: err2 } = await supabase
      .from("screenings")
      .insert({
        respondent_id: respondent.id,
        respuestas: respuestas ?? {},
        resultados: resultadosToStore,
        pack_years: srv.it,
        exposicion_ib: srv.ib,
        tabaquismo_cumple: srv.tabaquismoCumple,
        biomasa_cumple: srv.biomasaCumple
      })
      .select("*")
      .single();
    if (err2) return json({ error: err2.message }, 400, origin);

    return json({ ok: true, respondent, screening }, 201, origin);
  } catch (e) {
    return json({ error: e?.message ?? "Error inesperado" }, 500, origin);
  }
});
