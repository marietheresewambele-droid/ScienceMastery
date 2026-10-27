import RevisionCenter, { type Mode } from "@/components/revision/RevisionCenter";

const MODES: Mode[] = ["flashcards", "exam", "bookmarks", "due"];

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    subject?: string;
    topic?: string;
    subtopic?: string;
  }>;
}) {
  const params = await searchParams;
  // Older links (mixed / adaptive practice) fall back to spaced-repetition practice.
  const mode = MODES.find((value) => value === params.mode) ?? "flashcards";

  return (
    <RevisionCenter
      key={`${mode}:${params.subject}:${params.topic}:${params.subtopic}`}
      initialMode={mode}
      initialSubject={params.subject}
      initialTopic={params.topic}
      initialSubtopic={params.subtopic}
    />
  );
}
