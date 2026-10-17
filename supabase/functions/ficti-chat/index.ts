import Anthropic from 'npm:@anthropic-ai/sdk@0.27.3';

const SYSTEM_PROMPT = `You are the Ficti Garments concierge — a knowledgeable, refined brand assistant for Ficti Garments, a luxury golf apparel brand. Your tone is confident, warm, and tasteful — think private members' club, not call center.

About Ficti Garments:
- Tagline: "Make Your Stamp"
- Luxury golf apparel for the discerning golfer
- Inspired by the character and atmosphere of traditional golf venues — classic pubs, links courses, old-money clubhouses
- Brand aesthetic: dark, refined, Old World luxury with a modern edge
- Colors: deep charcoal, crimson, cream
- Based in the United States

What you can help with:
- Information about the Ficti brand, vision, and aesthetic
- Questions about golf apparel, style, and the collections
- Membership tiers (three levels available — details coming soon)
- Blog content and brand stories
- Directing customers to the right pages (Collections, Members, Contact)
- General questions about the brand

Keep responses concise — 2–4 sentences max unless the question requires more detail. Do not fabricate specific product names, prices, or availability since the catalog is still being built. If asked about something you don't know, say you'll have your team follow up and direct them to the Contact page.`;

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Service unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-10), // keep last 10 for context
    });

    const reply = response.content[0]?.type === 'text' ? response.content[0].text : '';

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
