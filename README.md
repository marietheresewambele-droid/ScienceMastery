# BrainSoma

AQA GCSE Biology, Chemistry and Physics mastery and revision platform.

## Adaptive engine

The adaptive engine is deterministic: approved questions and model answers are stored in Supabase, and hints are built from each question's Key Terms. Runtime AI is not required.

The learning cycle is:

1. Present an approved question.
2. Record rating, response time, answer reveal and number of hints used.
3. Classify the evidence as incorrect, supported correct or independent correct.
4. Route to a prerequisite/easier, parallel or harder approved question.
5. Schedule retrieval and update mastery evidence.
6. Require two consecutive independent successes before `secure` mastery.

Signed-out students can read published content and continue using local progress. Signed-in students also sync attempts, mastery evidence and retrieval dates to their private Supabase rows.

## Content workflow

Questions live in Supabase as **Subject → Topic → Subtopic → Question** (`subjects`, `topics`, `subtopics`, `question_catalog`, read through the `question_bank` view). The schema is `supabase/migrations/20261007120000_question_hierarchy.sql`, which also seeds the 25 AQA topics.

The authoring source is the BrainSoma standard workbook, one file per subject (e.g. `BrainSoma_Chemistry.xlsx`): a `Guide` sheet plus one sheet per topic (`T1 Atomic Structure`, …). Each topic sheet has a header row with these columns:

`Question ID` · `Legacy ID` · `Subject` · `Unit` · `Topic` · `Subtopic` · `Specification Reference` · `Question` · `Model Answer` · `Marks (1–6)` · `Assessment Objective` · `Qualification` · `Tier` · `Grade` · `Question Type` · `Key Terms` · `Source / Notes`

- `Question ID` is permanent: `BIO|CHEM|PHYS-Tnn-Qnnn`, and its prefix and topic must match `Subject` and `Unit`.
- `Unit` (T1, T2, …) decides the topic; the `Topic` text is informational.
- `Subtopic` names become the subtopic cards on each topic page. Numbered ones (`1.2 Cell Division`) sort numerically; the importer warns about unnumbered names mixed in with numbered ones.
- `Assessment Objective` is AO1, AO2 or AO3. Students always meet a topic in AO1 → AO2 → AO3 order, then subtopic order, then sheet row order.
- `Qualification`: `Combined and Separate Science` or `Separate Science only`. `Tier`: `Foundation and Higher`, `Foundation only` or `Higher only`.
- `Key Terms` are separated by semicolons. Hint 1 shows the model answer with every key term blanked out; hint 2 also shows each term's first letter.

Upload a workbook at **/admin/questions/upload**. The importer validates every row first and saves nothing while there are errors. Warnings (missing key terms, unnumbered subtopics, …) don't block the import. Re-uploading updates existing questions by ID and keeps their published/unpublished state.

## Local development

Create `.env.local` with:

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Admin access to `/admin` is not configured through an environment variable. Admins are rows in the `public.admin_users` table (see `supabase/migrations/20260930120000_admin_roles.sql`). After applying that migration, find your user id in the Supabase dashboard (Authentication → Users) and add yourself from the SQL editor:

```sql
insert into public.admin_users (user_id) values ('your-auth-user-uuid');
```

Only the server-side service-role client can read that table; browser roles have no access to it.

`SUPABASE_SERVICE_ROLE_KEY` is the project's service-role key from the Supabase dashboard (Project Settings → API). It is **not** prefixed with `NEXT_PUBLIC_` and must never be exposed to the browser — it's only read server-side, by the `/api/admin/questions/*` routes (parse, publish, list, edit, publish/unpublish), which use it to bypass RLS and read/write the question bank. Set it in Vercel's Environment Variables for any deployment that needs `/admin` to actually work, in addition to `.env.local` for local development.

Then run:

```bash
npm ci
npm run dev
```

Before merging content or engine changes, run:

```bash
npm test
npm run lint
npm run build
```
