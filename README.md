# ScienceMastery

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

```bash
npm run adaptive:seed
```

This creates `supabase/seed-adaptive-content.sql` and validates permanent IDs before publication. Apply the migration in `supabase/migrations`, then run the generated seed against the ScienceMastery Supabase project. Content versions are `BIO-2026.1`, `CHE-2026.1` and `PHY-2026.1`.

## Local development

Create `.env.local` with:

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

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
