#!/usr/bin/env python3
"""
Ficti Garments — Blog Writing Agent
=====================================
Writes 2 blog posts per month in Ficti Garments' brand voice and saves them
to Supabase as drafts. Run manually or schedule it with a cron job.

SETUP (one time):
    pip install anthropic httpx

USAGE:
    # Let the agent pick trending golf topics automatically
    python blog-agent.py

    # Give it specific topics
    python blog-agent.py --topics "equipment minimalism, playing golf in winter"

    # Write just one post (default is 2)
    python blog-agent.py --count 1

    # Preview in terminal without saving to Supabase
    python blog-agent.py --dry-run

REQUIREMENTS:
    ANTHROPIC_API_KEY  — get from https://console.anthropic.com
    SUPABASE_URL       — https://nusuluxjeckjcdgxzgyf.supabase.co
    SUPABASE_SERVICE_KEY — from Supabase Dashboard → Settings → API → service_role key
                           (NOT the publishable key — service key bypasses RLS so agent can write)
"""

import os
import re
import sys
import json
import argparse
import textwrap
from datetime import datetime, timezone

try:
    import anthropic
except ImportError:
    sys.exit("Missing dependency. Run:  pip install anthropic httpx")

try:
    import httpx
except ImportError:
    sys.exit("Missing dependency. Run:  pip install anthropic httpx")


# ─── Config ────────────────────────────────────────────────────────────────────

ANTHROPIC_API_KEY  = os.getenv("ANTHROPIC_API_KEY", "")
SUPABASE_URL       = os.getenv("SUPABASE_URL", "https://nusuluxjeckjcdgxzgyf.supabase.co")
SUPABASE_KEY       = os.getenv("SUPABASE_SERVICE_KEY", "")   # service_role key

CATEGORIES = [
    "Course Culture",
    "Design & Craft",
    "Players & Perspective",
    "Season Preview",
    "The Game",
    "Care & Longevity",
    "Founders",
    "Journal",
]

BRAND_VOICE = """
You are the editorial voice of Ficti Garments — a luxury golf apparel brand.

Brand personality:
- Measured, intelligent, unhurried. Never hype, never exclamation points.
- Writes like a thoughtful essay, not a product description or press release.
- Interested in the overlap between how people dress and how they play.
- Draws on craft, culture, architecture, and sport without being pretentious.
- Sentences are complete, sometimes long, always precise.
- Comfortable with silence and restraint as subjects.

Voice markers:
- Uses "we" for the brand, never "I".
- Never uses: "innovative", "game-changer", "luxury" (we show it, we don't say it), "perfect", "amazing".
- Favors: specific details, unexpected angles, earned conclusions.
- Opening lines hook with a scene, observation, or paradox — never a statement of intent.

Post structure:
- Title: sharp, often allusive. Under 10 words.
- Excerpt: 1–2 sentences. The single best reason to read further.
- Body: 500–700 words. 4–6 paragraphs. Ends with a quiet close, not a call to action.
  Paragraphs separated by blank lines.
"""


# ─── Topic generation ──────────────────────────────────────────────────────────

def generate_topics(client: anthropic.Anthropic, count: int) -> list[str]:
    """Ask Claude to suggest trending or timely golf topics."""
    month = datetime.now().strftime("%B %Y")
    msg = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=400,
        messages=[{
            "role": "user",
            "content": textwrap.dedent(f"""
                It is {month}. Suggest {count} specific, timely topics for a luxury golf apparel
                blog called "The Ficti Edit." Topics should intersect golf culture, style, craft,
                or the inner life of the game — not equipment reviews or tour scores.

                Return ONLY a JSON array of strings, nothing else.
                Example: ["The return of the cardigan on tour", "What Augusta teaches us about restraint"]
            """).strip()
        }]
    )
    raw = msg.content[0].text.strip()
    # Extract JSON array even if Claude wrapped it in markdown
    match = re.search(r'\[.*?\]', raw, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(raw)


# ─── Post writing ──────────────────────────────────────────────────────────────

def write_post(client: anthropic.Anthropic, topic: str) -> dict:
    """Write a full blog post for a given topic. Returns structured data."""
    prompt = textwrap.dedent(f"""
        Write a Ficti Garments blog post on this topic: "{topic}"

        Return ONLY valid JSON with exactly these fields:
        {{
            "title": "...",
            "slug": "url-friendly-slug-here",
            "category": "<one of: {', '.join(CATEGORIES)}>",
            "author": "Ficti Garments",
            "excerpt": "...",
            "body": "Full body text here. Separate paragraphs with \\n\\n. 500-700 words."
        }}

        No markdown, no extra keys, no prose outside the JSON object.
    """).strip()

    msg = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=2000,
        system=BRAND_VOICE,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = msg.content[0].text.strip()
    # Strip markdown code fences if present
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)

    post = json.loads(raw)

    # Ensure slug is URL-safe
    post["slug"] = re.sub(r'[^a-z0-9-]', '', re.sub(r'\s+', '-', post["slug"].lower()))

    return post


# ─── Supabase save ─────────────────────────────────────────────────────────────

def save_to_supabase(post: dict, publish: bool = False) -> str:
    """Insert post into Supabase. Returns the new post ID."""
    if not SUPABASE_KEY:
        raise ValueError("SUPABASE_SERVICE_KEY env var not set.")

    payload = {
        "title":        post["title"],
        "slug":         post["slug"],
        "category":     post["category"],
        "author":       post.get("author", "Ficti Garments"),
        "excerpt":      post["excerpt"],
        "body":         post["body"],
        "published":    publish,
        "featured":     False,
        "published_at": datetime.now(timezone.utc).isoformat() if publish else None,
    }

    r = httpx.post(
        f"{SUPABASE_URL}/rest/v1/posts",
        headers={
            "apikey":        SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type":  "application/json",
            "Prefer":        "return=representation",
        },
        json=payload,
        timeout=20,
    )

    if r.status_code not in (200, 201):
        raise RuntimeError(f"Supabase insert failed ({r.status_code}): {r.text}")

    return r.json()[0]["id"]


# ─── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Ficti Garments blog writing agent")
    parser.add_argument("--topics",   type=str,  default="",    help="Comma-separated topics to write about")
    parser.add_argument("--count",    type=int,  default=2,     help="Number of posts to write (default: 2)")
    parser.add_argument("--publish",  action="store_true",      help="Publish immediately (default: save as draft)")
    parser.add_argument("--dry-run",  action="store_true",      help="Print posts to terminal, don't save to Supabase")
    args = parser.parse_args()

    if not ANTHROPIC_API_KEY:
        sys.exit("Error: ANTHROPIC_API_KEY environment variable not set.")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    # Resolve topics
    if args.topics:
        topics = [t.strip() for t in args.topics.split(",") if t.strip()]
        # Pad or trim to requested count
        while len(topics) < args.count:
            topics.append(topics[-1] + " (alternate angle)")
        topics = topics[:args.count]
    else:
        print(f"Generating {args.count} topic ideas…")
        topics = generate_topics(client, args.count)

    print(f"\nTopics selected:")
    for i, t in enumerate(topics, 1):
        print(f"  {i}. {t}")
    print()

    results = []
    for i, topic in enumerate(topics, 1):
        print(f"Writing post {i}/{len(topics)}: "{topic}"…")
        post = write_post(client, topic)
        results.append(post)

        if args.dry_run:
            print("\n" + "─" * 60)
            print(f"TITLE:    {post['title']}")
            print(f"SLUG:     {post['slug']}")
            print(f"CATEGORY: {post['category']}")
            print(f"EXCERPT:  {post['excerpt']}")
            print(f"\n{post['body']}")
            print("─" * 60 + "\n")
        else:
            status = "published" if args.publish else "draft"
            post_id = save_to_supabase(post, publish=args.publish)
            print(f"  ✓ Saved as {status} (id: {post_id})")
            print(f"    → Title: {post['title']}")
            print(f"    → Review at: {SUPABASE_URL.replace('supabase.co', 'supabase.co')}")
            print(f"    → Edit at:   admin.html")
            print()

    if not args.dry_run:
        mode = "published" if args.publish else "saved as drafts"
        print(f"\n{len(results)} post(s) {mode}.")
        print("Open admin.html to review, edit, and publish.")


if __name__ == "__main__":
    main()
