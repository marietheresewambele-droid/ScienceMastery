import Link from "next/link";
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
  return <main className="min-h-screen bg-[#f7f9fa] text-[#0b1d33]">
    <section className="border-b border-[#e6eaee] bg-white"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <Link href="/" className="text-sm font-bold text-[#00a551]">← ScienceMastery home</Link>
      <p className="mt-8 text-sm font-bold uppercase tracking-widest text-[#00a551]">AQA GCSE Biology</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Choose a Biology topic</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-[#5a6b7f]">Practise all seven AQA Biology topics with 624 structured mastery questions, marking points and isolated progress tracking.</p>
    </div></section>
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-2">
      {topics.map(topic => <article key={topic.id} className="flex flex-col justify-between rounded-3xl border border-[#e6eaee] bg-white p-7 shadow-sm">
        <div><div className="flex gap-2">
          <span className="rounded-full bg-[#e9f8f0] px-3 py-1 text-xs font-bold text-[#02753a]">{topic.topicNumber}</span>
          <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-bold text-[#5a6b7f]">{topic.questions.length} questions</span>
        </div><h2 className="mt-4 text-2xl font-extrabold">{topic.title}</h2><p className="mt-2 leading-7 text-[#5a6b7f]">{topic.description}</p></div>
        <Link href={topic.route} className="mt-6 inline-flex w-fit rounded-xl bg-[#00a551] px-6 py-3 font-bold text-white hover:bg-[#028f46]">Start {topic.title}</Link>
      </article>)}
    </section>
  </main>;
}
