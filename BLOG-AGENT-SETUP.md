# Ficti Garments — Blog Writing Agent

This script uses Claude AI to write blog posts in Ficti Garments' brand voice and save them
directly to the website's database as drafts. You review and publish from the admin panel.

---

## One-time setup

### 1. Install Python dependencies

```bash
pip install anthropic httpx
```

### 2. Get an Anthropic API key

Go to https://console.anthropic.com → API Keys → Create Key.
Copy the key (starts with `sk-ant-…`).

### 3. Get the Supabase service key

- Go to https://supabase.com → your project → Settings → API
- Copy the **service_role** key (NOT the anon/publishable key)

### 4. Set environment variables

**Mac / Linux — paste these in your terminal before running:**
```bash
export ANTHROPIC_API_KEY="sk-ant-YOUR_KEY_HERE"
export SUPABASE_SERVICE_KEY="YOUR_SERVICE_ROLE_KEY_HERE"
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-YOUR_KEY_HERE"
$env:SUPABASE_SERVICE_KEY = "YOUR_SERVICE_ROLE_KEY_HERE"
```

---

## Running it

Navigate to the website folder first:

```bash
cd "/Users/bensmith/Desktop/Ficti Garments /Website"
```

### Let the agent pick topics automatically

```bash
python blog-agent.py
```

Writes 2 posts on topics it selects based on what's timely in golf. Saves as **drafts** —
nothing goes live until you publish from admin.html.

### Give it specific topics

```bash
python blog-agent.py --topics "the revival of golf knickers, how course architecture affects how you dress"
```

### Write just one post

```bash
python blog-agent.py --count 1
```

### Preview without saving (good for testing)

```bash
python blog-agent.py --dry-run
```

Prints the posts to the terminal. Nothing is saved.

### Publish immediately (skip draft review)

```bash
python blog-agent.py --publish
```

---

## Reviewing and editing posts

After running the script, open **admin.html** in a browser (via the local server or Netlify).
Sign in with the Ficti Garments account. Drafts appear in the sidebar. Click one to edit,
then toggle "Published" and hit Save to make it live.

---

## Setting up a monthly schedule (optional)

To run automatically on the 1st of each month, add a cron job:

```bash
crontab -e
```

Add this line (replace paths and keys):

```
0 9 1 * * ANTHROPIC_API_KEY="sk-ant-..." SUPABASE_SERVICE_KEY="..." python "/Users/bensmith/Desktop/Ficti Garments /Website/blog-agent.py" >> ~/ficti-blog-agent.log 2>&1
```

This runs at 9am on the 1st of every month and logs output to `~/ficti-blog-agent.log`.

---

## Cost estimate

Each run (2 posts) costs roughly **$0.10–$0.20** in Anthropic API credits using Claude Opus.
$5 in credits covers ~25–50 runs.
