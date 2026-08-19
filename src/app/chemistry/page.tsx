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

  return <main className="min-h-screen bg-cream text-ink">
  <section className="border-b-2 border-ink bg-teal-soft"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
    <Link href={homeHref} className="text-sm font-bold text-orange-dark">← ScienceMastery home</Link>
    <p className="mt-8 text-sm font-bold uppercase tracking-widest text-teal-dark">AQA GCSE Chemistry</p>
    <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Choose a Chemistry topic</h1>
    <p className="mt-4 max-w-3xl text-lg leading-8 text-ink-soft">Practise all ten AQA Chemistry topics with 410 structured mastery questions, marking points and isolated progress tracking.</p>
  </div></section>
  <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-2">{topics.map(topic=><article key={topic.id} className="sm-panel flex flex-col justify-between p-7">
    <div><div className="flex gap-2"><span className="rounded-md border-2 border-ink bg-teal px-3 py-1 text-xs font-bold text-white">{topic.topicNumber}</span><span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold text-ink-soft">{topic.questions.length} questions</span></div><h2 className="mt-4 font-display text-2xl font-bold">{topic.title}</h2><p className="mt-2 leading-7 text-ink-soft">{topic.description}</p></div>
    <Link href={topic.route} className="sm-btn mt-6 inline-flex w-fit bg-teal px-6 py-3 text-white">Start {topic.title}</Link>
  </article>)}</section></main>}
