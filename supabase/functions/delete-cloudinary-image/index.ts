// ==============================================================================
// MANGAL SETU — SUPABASE EDGE FUNCTION: DELETE CLOUDINARY IMAGES
// Location: supabase/functions/delete-cloudinary-image/index.ts
// Runtime: Deno / TypeScript (Supabase Edge Functions)
// ==============================================================================

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
    const { publicIds, imageUrls } = await req.json();

    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME") || "yohel4bd";
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!apiKey || !apiSecret) {
      console.warn("[Cloudinary Edge] API credentials not set in environment secrets.");
      return new Response(
        JSON.stringify({ error: "Cloudinary API credentials not configured in secrets", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const idsToDelete = new Set<string>();

    if (Array.isArray(publicIds)) {
      publicIds.forEach((id: string) => {
        if (id && typeof id === "string" && id.trim()) {
          idsToDelete.add(id.trim());
        }
      });
    }

    if (Array.isArray(imageUrls)) {
      imageUrls.forEach((url: string) => {
        if (typeof url === "string" && url.includes("res.cloudinary.com")) {
          const clean = url.split("?")[0].split("#")[0];
          const match = clean.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
          if (match && match[1]) {
            const rawId = match[1].replace(/^(?:[a-z]_[a-zA-Z0-9_,-]+\/)+/, "");
            idsToDelete.add(rawId);
          }
        }
      });
    }

    const results = [];
    for (const pid of Array.from(idsToDelete)) {
      const timestamp = Math.floor(Date.now() / 1000);
      const toSign = `public_id=${pid}&timestamp=${timestamp}${apiSecret}`;

      // Generate SHA-1 Hex signature
      const msgUint8 = new TextEncoder().encode(toSign);
      const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      const formData = new FormData();
      formData.append("public_id", pid);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.info(`[Cloudinary Destroy] PID: ${pid} Result:`, data);
      results.push({ publicId: pid, result: data });
    }

    return new Response(
      JSON.stringify({ success: true, count: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Cloudinary Edge Error]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
