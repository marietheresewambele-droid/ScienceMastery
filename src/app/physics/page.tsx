import Link from "next/link";
import { physicsEnergyConfig } from "@/data/topics/physics-energy";
import { physicsElectricityConfig } from "@/data/topics/physics-electricity";
import { physicsParticleModelOfMatterConfig } from "@/data/topics/physics-particle-model-of-matter";
import { physicsAtomicStructureConfig } from "@/data/topics/physics-atomic-structure";
import { physicsForcesConfig } from "@/data/topics/physics-forces";
import { physicsWavesConfig } from "@/data/topics/physics-waves";
import { physicsMagnetismAndElectromagnetismConfig } from "@/data/topics/physics-magnetism-and-electromagnetism";
import { physicsSpacePhysicsConfig } from "@/data/topics/physics-space-physics";
const topics=[
  physicsEnergyConfig,
  physicsElectricityConfig,
  physicsParticleModelOfMatterConfig,
  physicsAtomicStructureConfig,
  physicsForcesConfig,
  physicsWavesConfig,
  physicsMagnetismAndElectromagnetismConfig,
  physicsSpacePhysicsConfig,
];
export default function PhysicsPage(){return <main className="min-h-screen bg-[#f7f9fa] text-[#0b1d33]">
  <section className="border-b border-[#e6eaee] bg-white"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
    <Link href="/" className="text-sm font-bold text-[#00a551]">← ScienceMastery home</Link><p className="mt-8 text-sm font-bold uppercase tracking-widest text-[#00a551]">AQA GCSE Physics</p>
    <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Choose a Physics topic</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#5a6b7f]">Practise all eight AQA Physics topics with 177 structured mastery questions, marking points and isolated progress tracking.</p>
  </div></section>
  <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-2">{topics.map(topic=><article key={topic.id} className="flex flex-col justify-between rounded-3xl border border-[#e6eaee] bg-white p-7 shadow-sm">
    <div><div className="flex gap-2"><span className="rounded-full bg-[#e9f8f0] px-3 py-1 text-xs font-bold text-[#02753a]">{topic.topicNumber}</span><span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-bold text-[#5a6b7f]">{topic.questions.length} questions</span></div><h2 className="mt-4 text-2xl font-extrabold">{topic.title}</h2><p className="mt-2 leading-7 text-[#5a6b7f]">{topic.description}</p></div>
    <Link href={topic.route} className="mt-6 inline-flex w-fit rounded-xl bg-[#00a551] px-6 py-3 font-bold text-white hover:bg-[#028f46]">Start {topic.title}</Link>
  </article>)}</section></main>}
