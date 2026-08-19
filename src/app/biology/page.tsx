"use client";

import Link from "next/link";
import { useHomeHref } from "@/hooks/useHomeHref";
import { cellBiologyConfig } from "@/data/topics/cell-biology";
import { organisationConfig } from "@/data/topics/organisation";
import { infectionAndResponseConfig } from "@/data/topics/infection-and-response";
import { bioenergeticsConfig } from "@/data/topics/bioenergetics";
import { homeostasisAndResponseConfig } from "@/data/topics/homeostasis-and-response";
import { inheritanceVariationAndEvolutionConfig } from "@/data/topics/inheritance-variation-and-evolution";
import { ecologyConfig } from "@/data/topics/ecology";

const topics = [cellBiologyConfig, organisationConfig, infectionAndResponseConfig,
  bioenergeticsConfig, homeostasisAndResponseConfig,
  inheritanceVariationAndEvolutionConfig, ecologyConfig];

export default function BiologyPage() {
  const homeHref = useHomeHref();

  return <main className="min-h-screen bg-cream text-ink">
    <section className="border-b-2 border-ink bg-moss-soft"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <Link href={homeHref} className="text-sm font-bold text-orange-dark">← ScienceMastery home</Link>
      <p className="mt-8 text-sm font-bold uppercase tracking-widest text-moss-dark">AQA GCSE Biology</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Choose a Biology topic</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-ink-soft">Practise all seven AQA Biology topics with 624 structured mastery questions, marking points and isolated progress tracking.</p>
    </div></section>
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-2">
      {topics.map(topic => <article key={topic.id} className="sm-panel flex flex-col justify-between p-7">
        <div><div className="flex gap-2">
          <span className="rounded-md border-2 border-ink bg-moss px-3 py-1 text-xs font-bold text-white">{topic.topicNumber}</span>
          <span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold text-ink-soft">{topic.questions.length} questions</span>
        </div><h2 className="mt-4 font-display text-2xl font-bold">{topic.title}</h2><p className="mt-2 leading-7 text-ink-soft">{topic.description}</p></div>
        <Link href={topic.route} className="sm-btn mt-6 inline-flex w-fit bg-moss px-6 py-3 text-white">Start {topic.title}</Link>
      </article>)}
    </section>
  </main>;
}
