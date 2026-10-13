// Supabase Edge Function: subscribe
// Deploy via Supabase Dashboard → Edge Functions → Create function → paste this
// Then set secret: MAILCHIMP_API_KEY = (your key from Mailchimp → Account → Extras → API keys)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MC_API_KEY = Deno.env.get("MAILCHIMP_API_KEY") ?? "";
const MC_LIST_ID = "eb3aff347e";
const MC_DC = MC_API_KEY.split("-").pop() ?? "us17";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, first_name = "", last_name = "" } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = btoa("anystring:" + MC_API_KEY);
    const res = await fetch(
      `https://${MC_DC}.api.mailchimp.com/3.0/lists/${MC_LIST_ID}/members`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
          merge_fields: { FNAME: first_name, LNAME: last_name },
        }),
      }
    );

    const data = await res.json();

    // 400 with "Member Exists" is still a success
    if (res.ok || data.title === "Member Exists") {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: data.detail || "Subscription failed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
