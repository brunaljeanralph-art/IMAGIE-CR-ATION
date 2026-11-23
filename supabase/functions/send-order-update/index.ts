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
const statusLabels: Record<string, string> = {
  received: "Commande reçue",
  awaiting_confirmation: "En attente de confirmation",
  payment_pending: "Paiement en attente",
  confirmed: "Commande confirmée",
  in_preparation: "En préparation",
  in_production: "En production",
  shipped: "Commande expédiée",
  ready_for_pickup: "Prête à retirer",
  delivered: "Commande livrée",
  cancelled: "Commande annulée",
  refunded: "Commande remboursée",
};

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") || "";
  const headers = corsHeaders(origin);
  const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  if (!allowedOrigins.includes(origin)) return json({ error: "ORIGIN_NOT_ALLOWED" }, 403);

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "AUTHENTICATION_REQUIRED" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "SERVER_NOT_CONFIGURED" }, 503);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "INVALID_SESSION" }, 401);
    const { data: isAdmin, error: roleError } = await userClient.rpc("is_admin");
    if (roleError || isAdmin !== true) return json({ error: "ADMIN_REQUIRED" }, 403);

    const body = await request.json().catch(() => ({}));
    const orderId = typeof body?.order_id === "string" ? body.order_id.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
      return json({ error: "INVALID_ORDER_ID" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: order, error: orderError } = await admin.from("orders")
      .select("id,user_id,order_number,status")
      .eq("id", orderId).maybeSingle();
    if (orderError) throw orderError;
    if (!order) return json({ error: "ORDER_NOT_FOUND" }, 404);
    if (!order.user_id) return json({ ok: true, sent: 0, failed: 0, skipped: "ORDER_HAS_NO_MEMBER_ACCOUNT" });

    const { data: subscriptions, error: subscriptionError } = await admin.from("push_subscriptions")
      .select("endpoint,p256dh,auth")
      .eq("user_id", order.user_id)
      .limit(1000);
    if (subscriptionError) throw subscriptionError;
    if (!subscriptions?.length) return json({ ok: true, sent: 0, failed: 0, skipped: "CUSTOMER_HAS_NO_PUSH_SUBSCRIPTION" });

    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:dieudonnejuillet473@gmail.com";
    if (!vapidPublic || !vapidPrivate) return json({ error: "PUSH_NOT_CONFIGURED" }, 503);

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    const label = statusLabels[String(order.status)] || String(order.status);
    const payload = JSON.stringify({
      title: `Mise à jour de votre commande ${order.order_number}`.slice(0, 90),
      body: `État actuel : ${label}. Ouvrez votre espace membre pour les détails.`,
      url: "/compte.html",
    });
    let sent = 0;
    let failed = 0;
    await Promise.all(subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        }, payload);
        sent++;
      } catch (error) {
        failed++;
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        }
      }
    }));
    return json({ ok: true, sent, failed, total: subscriptions.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNEXPECTED_ERROR";
    return json({ error: message.slice(0, 300) }, 500);
  }
});
