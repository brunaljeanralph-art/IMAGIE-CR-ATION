import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const allowedOrigins = (Deno.env.get("IMAGIE_ALLOWED_ORIGINS") || "https://imagie-cr-ation.vercel.app,http://localhost:5173,http://127.0.0.1:5173")
  .split(",").map((value) => value.trim()).filter(Boolean);
const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "null",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") || "";
  const headers = corsHeaders(origin);
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...headers, "Content-Type": "application/json" } });
  if (!allowedOrigins.includes(origin)) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers: { ...headers, "Content-Type": "application/json" } });

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) throw new Error("Authentication required");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:dieudonnejuillet473@gmail.com";
    if (!supabaseUrl || !anonKey || !serviceKey || !vapidPublic || !vapidPrivate) throw new Error("Push service is not configured");

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...headers, "Content-Type": "application/json" } });
    const { data: isAdmin, error: roleError } = await userClient.rpc("is_admin");
    if (roleError || isAdmin !== true) return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...headers, "Content-Type": "application/json" } });

    const input = await request.json();
    const title = String(input?.title || "IMAGIE CRÉATION").trim().slice(0, 90);
    const body = String(input?.body || "Une nouveauté vous attend.").trim().slice(0, 220);
    const path = typeof input?.url === "string" && input.url.startsWith("/") && !input.url.startsWith("//") ? input.url : "/";
    if (!title || !body) throw new Error("Title and body are required");

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: subscriptions, error: subscriptionError } = await admin.from("push_subscriptions")
      .select("endpoint,p256dh,auth").limit(10000);
    if (subscriptionError) throw subscriptionError;

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    let sent = 0;
    let failed = 0;
    await Promise.all((subscriptions || []).map(async (subscription) => {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title, body, url: path }));
        sent++;
      } catch (error) {
        failed++;
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        }
      }
    }));
    return new Response(JSON.stringify({ ok: true, sent, failed, total: subscriptions?.length || 0 }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Authentication required" ? 401 : 400;
    return new Response(JSON.stringify({ error: message }), { status, headers: { ...headers, "Content-Type": "application/json" } });
  }
});
