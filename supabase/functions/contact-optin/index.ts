// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const ALLOWED_ORIGINS = [
  "http://localhost:4200",                 // Angular local
  "https://cuestionariotamizajeprod.com",
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

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST")    return json({ error: "Método no permitido" }, 405, origin);

  try {
    const body = await req.json();
    const { consentimiento, nombre, telefono, email, respondent_id, screening_id, contexto } = body ?? {};
    if (!consentimiento) return json({ error: "Se requiere consentimiento explícito" }, 400, origin);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "Faltan variables de entorno" }, 500, origin);

    const { createClient } = await import("npm:@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase
      .from("contact_requests")
      .insert({
        respondent_id: respondent_id ?? null,
        screening_id: screening_id ?? null,
        nombre: nombre ?? null,
        telefono: telefono ?? null,
        email: email ?? null,
        consentimiento: true,
        contexto: contexto ?? {}
      })
      .select("*")
      .single();
    if (error) return json({ error: error.message }, 400, origin);

    return json({ ok: true, contact_request: data }, 201, origin);
  } catch (e) {
    return json({ error: e?.message ?? "Error inesperado" }, 500, origin);
  }
});

