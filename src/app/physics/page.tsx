"use client";

import Link from "next/link";
import { useHomeHref } from "@/hooks/useHomeHref";
import { topicRegistry } from "@/data/topics/registry";
import { useQuestionBank } from "@/lib/questionBank";
export default function PhysicsPage(){
  const homeHref = useHomeHref();
  const topics = topicRegistry.filter((topic) => topic.subject === "physics");
  const { questions } = useQuestionBank();
  const countFor = (slug: string) => questions?.filter((question) => question.subject === "physics" && question.topicSlug === slug).length;
  const questionTotal = questions ? questions.filter((question) => question.subject === "physics").length : "…";

  return <main className="min-h-screen bg-cream text-ink">
  <section className="border-b-2 border-ink bg-orange-soft"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
    <Link href={homeHref} className="text-sm font-bold text-orange-dark">← BrainSoma home</Link><p className="mt-8 text-sm font-bold uppercase tracking-widest text-orange-dark">AQA GCSE Physics</p>
    <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Choose a Physics topic</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-ink-soft">Practise all eight AQA Physics topics with {questionTotal} questions from the Physics workbook, complete with model answers and isolated progress tracking.</p>
  </div></section>
  <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-2">{topics.map(topic=><article key={topic.id} className="sm-panel flex flex-col justify-between p-7">
    <div><div className="flex gap-2"><span className="rounded-md border-2 border-ink bg-orange px-3 py-1 text-xs font-bold text-white">{topic.topicNumber}</span><span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold text-ink-soft">{countFor(topic.id) ?? "…"} questions</span></div><h2 className="mt-4 font-display text-2xl font-bold">{topic.title}</h2><p className="mt-2 leading-7 text-ink-soft">{topic.description}</p></div>
    <Link href={topic.route} className="sm-btn mt-6 inline-flex w-fit bg-orange px-6 py-3 text-white">Start {topic.title}</Link>
  </article>)}</section></main>}
