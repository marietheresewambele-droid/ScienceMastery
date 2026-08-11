import RevisionCenter from "@/components/revision/RevisionCenter";
export default async function PracticePage({searchParams}:{searchParams:Promise<{mode?:"mixed"|"flashcards"|"bookmarks"|"due";subject?:string;topic?:string}>}){const p=await searchParams;return <RevisionCenter initialMode={p.mode} initialSubject={p.subject} initialTopic={p.topic}/>;}
