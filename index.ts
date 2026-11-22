// Public pre-OAuth Turnstile verification. The CAPTCHA secret stays in Supabase secrets.
// Password signup/signin/reset use Supabase Auth's built-in CAPTCHA integration instead.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const jsonHeaders = { "Content-Type": "application/json" };

function configuredList(name: string): string[] {
  return (Deno.env.get(name) ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin") ?? "";
    const allowedOrigins = configuredList("IMAGIE_ALLOWED_ORIGINS");
    if (!allowedOrigins.includes(origin.toLowerCase())) {
      return new Response(null, { status: 403 });
    }
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Vary": "Origin",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  const origin = req.headers.get("origin") ?? "";
  const allowedOrigins = configuredList("IMAGIE_ALLOWED_ORIGINS");
  if (!allowedOrigins.includes(origin.toLowerCase())) {
    return new Response(JSON.stringify({ ok: false, error: "ORIGIN_NOT_ALLOWED" }), {
      status: 403,
      headers: jsonHeaders,
    });
  }

  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  const allowedHosts = configuredList("IMAGIE_ALLOWED_HOSTNAMES");
  if (!secret || allowedHosts.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: "CAPTCHA_NOT_CONFIGURED" }), {
      status: 503,
      headers: { ...jsonHeaders, "Access-Control-Allow-Origin": origin, "Vary": "Origin" },
    });
  }

  if (!(req.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
    return new Response(JSON.stringify({ ok: false, error: "UNSUPPORTED_MEDIA_TYPE" }), {
      status: 415,
      headers: { ...jsonHeaders, "Access-Control-Allow-Origin": origin, "Vary": "Origin" },
    });
  }

  let token = "";
  try {
    const body = await req.json();
    token = typeof body?.token === "string" ? body.token.trim() : "";
  } catch {
    token = "";
  }
  if (!token || token.length > 2048) {
    return new Response(JSON.stringify({ ok: false, error: "MISSING_OR_INVALID_TOKEN" }), {
      status: 400,
      headers: { ...jsonHeaders, "Access-Control-Allow-Origin": origin, "Vary": "Origin" },
    });
  }

  const form = new URLSearchParams({ secret, response: token });
  const clientIp = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  if (clientIp) form.set("remoteip", clientIp);

  try {
    const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    if (!verification.ok) throw new Error("SITEVERIFY_UNAVAILABLE");
    const result = await verification.json();
    const hostname = String(result?.hostname ?? "").toLowerCase();
    const valid = result?.success === true && allowedHosts.includes(hostname);
    return new Response(JSON.stringify({ ok: valid }), {
      status: valid ? 200 : 400,
      headers: { ...jsonHeaders, "Access-Control-Allow-Origin": origin, "Vary": "Origin" },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "CAPTCHA_VERIFICATION_UNAVAILABLE" }), {
      status: 502,
      headers: { ...jsonHeaders, "Access-Control-Allow-Origin": origin, "Vary": "Origin" },
    });
  }
});
