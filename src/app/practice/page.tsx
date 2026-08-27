import RevisionCenter from "@/components/revision/RevisionCenter";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: "adaptive" | "mixed" | "flashcards" | "exam" | "bookmarks" | "due";
    subject?: string;
    topic?: string;
    subtopic?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <RevisionCenter
      initialMode={params.mode}
      initialSubject={params.subject}
      initialTopic={params.topic}
      initialSubtopic={params.subtopic}
    />
  );
}
