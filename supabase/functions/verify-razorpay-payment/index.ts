// @ts-nocheck
// ==============================================================================
// MANGAL SETU — SUPABASE EDGE FUNCTION: VERIFY RAZORPAY PAYMENT
// Location: supabase/functions/verify-razorpay-payment/index.ts
// Runtime: Deno / TypeScript (Supabase Edge Functions)
// Prevents fraudulent client-side activation using HMAC-SHA256 signature verification
// ==============================================================================

declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      userEmail,
      userName
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required payment verification parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!keySecret || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. CRYPTOGRAPHIC SIGNATURE VERIFICATION (Prevents spoofed / forged payments)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.warn("[Security Alert] Tampered Razorpay payment signature detected for user:", userId);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid payment signature. Verification failed." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. INITIALIZE PRIVILEGED BACKEND CLIENT (using service_role key)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + 30); // 30 Days Pass

    const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const planStart = now.toISOString().split("T")[0];
    const planExpiry = expiry.toISOString().split("T")[0];

    // 3. PERSIST AUTHENTIC PAYMENT RECORD IN PAYMENTS TABLE
    const { error: payErr } = await supabaseAdmin.from("payments").upsert({
      id: razorpay_payment_id,
      user_id: String(userId),
      user_name: userName || "Registered Member",
      plan: "Boys 30 Days Pass (₹99)",
      amount: 99.00,
      currency: "INR",
      method: "UPI / Razorpay",
      razorpay_payment_id: razorpay_payment_id,
      status: "success",
      date: dateStr,
      time: timeStr
    }, { onConflict: "id" });

    if (payErr) console.warn("[DB Payment Log Warning]:", payErr.message);

    // 4. ACTIVATE 30-DAY PASS IN PROFILES TABLE
    const numId = Number(userId);
    if (!isNaN(numId) && numId > 0) {
      await supabaseAdmin.from("profiles").update({
        payment_status: "paid",
        updated_at: new Date().toISOString()
      }).eq("id", numId);
    }

    await supabaseAdmin.from("profiles").update({
      payment_status: "paid",
      updated_at: new Date().toISOString()
    }).eq("user_id", String(userId));

    if (userEmail) {
      await supabaseAdmin.from("profiles").update({
        payment_status: "paid",
        updated_at: new Date().toISOString()
      }).ilike("email", userEmail.trim().toLowerCase());

      // 5. ALSO UPDATE USERS TABLE
      await supabaseAdmin.from("users").update({
        payment_status: "Active",
        plan_start: planStart,
        plan_expiry: planExpiry,
        updated_at: new Date().toISOString()
      }).ilike("email", userEmail.trim().toLowerCase());
    }

    console.info(`[Payment Verified]: User ${userId} successfully activated 30-day pass.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment successfully verified and 30-day membership activated!",
        paymentId: razorpay_payment_id,
        planStart: planStart,
        planExpiry: planExpiry
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[Payment Verification Error]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Payment verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
