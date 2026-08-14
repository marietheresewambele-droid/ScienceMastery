"use client";

import Link from "next/link";
import { useHomeHref } from "@/hooks/useHomeHref";
import { atomicStructureAndThePeriodicTableConfig } from "@/data/topics/atomic-structure-and-the-periodic-table";
import { bondingStructureAndPropertiesOfMatterConfig } from "@/data/topics/bonding-structure-and-properties-of-matter";
import { quantitativeChemistryConfig } from "@/data/topics/quantitative-chemistry";
import { chemicalChangesConfig } from "@/data/topics/chemical-changes";
import { energyChangesConfig } from "@/data/topics/energy-changes";
import { rateAndExtentOfChemicalChangeConfig } from "@/data/topics/rate-and-extent-of-chemical-change";
import { organicChemistryConfig } from "@/data/topics/organic-chemistry";
import { chemicalAnalysisConfig } from "@/data/topics/chemical-analysis";
import { chemistryOfTheAtmosphereConfig } from "@/data/topics/chemistry-of-the-atmosphere";
import { usingResourcesConfig } from "@/data/topics/using-resources";
const topics=[atomicStructureAndThePeriodicTableConfig,
  bondingStructureAndPropertiesOfMatterConfig,
  quantitativeChemistryConfig,
  chemicalChangesConfig,
  energyChangesConfig,
  rateAndExtentOfChemicalChangeConfig,
  organicChemistryConfig,
  chemicalAnalysisConfig,
  chemistryOfTheAtmosphereConfig,
  usingResourcesConfig];
export default function ChemistryPage(){
  const homeHref = useHomeHref();

  return <main className="min-h-screen bg-[#f7f9fa] text-[#0b1d33]">
  <section className="border-b border-[#e6eaee] bg-white"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
    <Link href={homeHref} className="text-sm font-bold text-[#00a551]">← ScienceMastery home</Link>
    <p className="mt-8 text-sm font-bold uppercase tracking-widest text-[#00a551]">AQA GCSE Chemistry</p>
    <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Choose a Chemistry topic</h1>
    <p className="mt-4 max-w-3xl text-lg leading-8 text-[#5a6b7f]">Practise all ten AQA Chemistry topics with 410 structured mastery questions, marking points and isolated progress tracking.</p>
  </div></section>
  <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-2">{topics.map(topic=><article key={topic.id} className="flex flex-col justify-between rounded-3xl border border-[#e6eaee] bg-white p-7 shadow-sm">
    <div><div className="flex gap-2"><span className="rounded-full bg-[#e9f8f0] px-3 py-1 text-xs font-bold text-[#02753a]">{topic.topicNumber}</span><span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-bold text-[#5a6b7f]">{topic.questions.length} questions</span></div><h2 className="mt-4 text-2xl font-extrabold">{topic.title}</h2><p className="mt-2 leading-7 text-[#5a6b7f]">{topic.description}</p></div>
    <Link href={topic.route} className="mt-6 inline-flex w-fit rounded-xl bg-[#00a551] px-6 py-3 font-bold text-white hover:bg-[#028f46]">Start {topic.title}</Link>
  </article>)}</section></main>}
