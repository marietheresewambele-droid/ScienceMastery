# BrainSoma

AQA GCSE Biology, Chemistry and Physics mastery and revision platform.

## Adaptive engine

The adaptive engine is deterministic: approved question content, model answers, marking points, hints and question relationships are stored in Supabase. Runtime AI is not required.

The learning cycle is:

1. Present an approved question.
2. Record rating, response time, answer reveal and number of hints used.
3. Classify the evidence as incorrect, supported correct or independent correct.
4. Route to a prerequisite/easier, parallel or harder approved question.
5. Schedule retrieval and update mastery evidence.
6. Require two consecutive independent successes before `secure` mastery.

Signed-out students can read published content and continue using local progress. Signed-in students also sync attempts, mastery evidence and retrieval dates to their private Supabase rows.

## Content workflow

The curriculum workbooks remain the authoring source. Approved workbook exports are normalized into the subject JSON files under `src/data`, then the reproducible seed is generated with:

With the supplied adaptive-ready workbooks in the default Desktop folder, import them with:

```bash
npm run content:import-workbooks
```

The importer reads the topic sheets' self-contained questions and model answers, and uses the adaptive map for permanent relationships. To use another folder, set `BRAINSOMA_WORKBOOK_DIR` before running the command.

```bash
npm run adaptive:seed
```

This creates `supabase/seed-adaptive-content.sql` and validates permanent IDs before publication. Apply the migration in `supabase/migrations`, then run the generated seed against the BrainSoma Supabase project. Content versions are `BIO-2026.1`, `CHE-2026.1` and `PHY-2026.1`.

## Local development

Create `.env.local` with:

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_ADMIN_EMAILS=you@example.com,editor@example.com
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`NEXT_PUBLIC_ADMIN_EMAILS` is a comma-separated allowlist of Supabase account emails permitted to use `/admin/content`. Anyone signed in with an email outside this list is shown an access-denied screen.

`SUPABASE_SERVICE_ROLE_KEY` is the project's service-role key from the Supabase dashboard (Project Settings → API). It is **not** prefixed with `NEXT_PUBLIC_` and must never be exposed to the browser — it's only read by the `/api/admin/content/publish` route, which uses it to bypass RLS and write approved content. Set it in Vercel's Environment Variables for any deployment that needs `/admin/content` to actually publish, in addition to `.env.local` for local development.

Then run:

```bash
npm ci
npm run dev
```

Before merging content or engine changes, run:

```bash
npm run adaptive:seed
npm run lint
npm run build
```
