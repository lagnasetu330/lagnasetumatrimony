// @ts-nocheck
// ==============================================================================
// MANGAL SETU — SUPABASE EDGE FUNCTION: CREATE RAZORPAY ORDER
// Location: supabase/functions/create-razorpay-order/index.ts
// Runtime: Deno / TypeScript (Supabase Edge Functions)
// ==============================================================================

declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, userName, userEmail } = await req.json();

    if (!userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required user information" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Razorpay credentials stored safely in Supabase Environment Secrets (NEVER in frontend code!)
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ error: "Razorpay keys are not configured on server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderAmount = 9900; // ₹99.00 in paise (Fixed on server — CANNOT be tampered by client)
    const receipt = `rcpt_${String(userId).slice(-8)}_${Date.now().toString().slice(-6)}`;

    // Create authentic Order via Razorpay REST API
    const authHeader = "Basic " + btoa(`${keyId}:${keySecret}`);
    const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: orderAmount,
        currency: "INR",
        receipt: receipt,
        notes: {
          userId: String(userId),
          userEmail: String(userEmail),
          userName: String(userName || "Mangal Setu Member"),
          plan: "Boys 30 Days Pass (₹99)"
        }
      })
    });

    const orderData = await rzpResponse.json();

    if (!rzpResponse.ok) {
      console.error("[Razorpay Order Error]:", orderData);
      return new Response(
        JSON.stringify({ error: orderData.error?.description || "Failed to create Razorpay order" }),
        { status: rzpResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return official orderId and keyId to frontend
    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId: keyId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
