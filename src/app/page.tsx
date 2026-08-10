import Link from "next/link";
import { cellBiologyConfig } from "@/data/topics/cell-biology";
import { organisationConfig } from "@/data/topics/organisation";
import { infectionAndResponseConfig } from "@/data/topics/infection-and-response";
import { bioenergeticsConfig } from "@/data/topics/bioenergetics";
import { homeostasisAndResponseConfig } from "@/data/topics/homeostasis-and-response";
import { inheritanceVariationAndEvolutionConfig } from "@/data/topics/inheritance-variation-and-evolution";
import { ecologyConfig } from "@/data/topics/ecology";

const FlaskIcon = ({ className = "h-5 w-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 3h6" />
    <path d="M10 3v6.3L4.8 18a3 3 0 0 0 2.7 4.4h9a3 3 0 0 0 2.7-4.4L14 9.3V3" />
    <path d="M7.5 15h9" />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m5 12 4 4L19 6" />
  </svg>
);

const features = [
  {
    label: "Mastery questions",
    title: "Practise the knowledge that matters",
    description:
      "Work through focused, self-contained questions organised by AQA Biology topic and subtopic.",
  },
  {
    label: "Marking points",
    title: "Understand how marks are awarded",
    description:
      "Compare your response with concise marking points drawn from the ScienceMastery workbook.",
  },
  {
    label: "Flashcards",
    title: "Return to difficult knowledge",
    description:
      "Use active recall to revisit concepts until you can explain them independently.",
  },
  {
    label: "Exam intelligence",
    title: "Recognise recurring question families",
    description:
      "Connect questions by scientific concept, assessment objective and common exam wording.",
  },
];

const biologyTopics = [
  cellBiologyConfig,
  organisationConfig,
  infectionAndResponseConfig,
  bioenergeticsConfig,
  homeostasisAndResponseConfig,
  inheritanceVariationAndEvolutionConfig,
  ecologyConfig,
];

const steps = [
  {
    number: "01",
    title: "Choose a Biology topic",
    description:
      "Start with Cell Biology, then move through the remaining AQA Biology topics.",
  },
  {
    number: "02",
    title: "Answer from memory",
    description:
      "Attempt each question before revealing the marking points or model response.",
  },
  {
    number: "03",
    title: "Check and improve",
    description:
      "Identify missing scientific ideas and return to questions that need more practice.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#0b1d33]">
      <header className="sticky top-0 z-50 border-b border-[#e6eaee] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00a551] text-white shadow-sm">
              <FlaskIcon />
            </span>

            <span className="text-xl font-extrabold tracking-tight">
              Science<span className="text-[#00a551]">Mastery</span>
            </span>
          </a>

          <nav
            className="hidden items-center gap-7 text-sm font-semibold text-[#5a6b7f] md:flex"
            aria-label="Main navigation"
          >
            <a href="#subjects" className="transition hover:text-[#0b1d33]">
              Biology
            </a>
            <Link href="/chemistry" className="transition hover:text-[#0b1d33]">
              Chemistry
            </Link>
            <a href="#features" className="transition hover:text-[#0b1d33]">
              How it works
            </a>
            <a href="#about" className="transition hover:text-[#0b1d33]">
              About
            </a>
          </nav>

          <a
            href="#subjects"
            className="rounded-xl bg-[#00a551] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#028f46]"
          >
            Start revising
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#e9f8f0]" />
        <div className="absolute -bottom-48 -left-40 h-96 w-96 rounded-full bg-[#f1f5f9]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#e9f8f0] px-3 py-1.5 text-xs font-bold text-[#02753a]">
              <span className="h-2 w-2 rounded-full bg-[#00a551]" />
              Free AQA GCSE Biology revision
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Master GCSE Biology,
              <span className="block text-[#00a551]">
                one question at a time.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#5a6b7f]">
              ScienceMastery turns AQA Biology exam intelligence into focused
              questions, clear marking points and structured retrieval practice.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#subjects"
                className="rounded-xl bg-[#00a551] px-6 py-3.5 font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#028f46]"
              >
                Explore Biology
              </a>

              <a
                href="#features"
                className="rounded-xl border border-[#dce2e7] bg-white px-6 py-3.5 font-bold transition hover:border-[#00a551] hover:text-[#02753a]"
              >
                See how it works
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#5a6b7f]">
              <span className="flex items-center gap-2">
                <span className="text-[#00a551]">
                  <CheckIcon />
                </span>
                Free for students
              </span>

              <span className="flex items-center gap-2">
                <span className="text-[#00a551]">
                  <CheckIcon />
                </span>
                Built for AQA
              </span>

              <span className="flex items-center gap-2">
                <span className="text-[#00a551]">
                  <CheckIcon />
                </span>
                Mobile-friendly
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rotate-3 rounded-[2rem] bg-[#d3f1e1]" />

            <div className="relative rounded-[2rem] border border-[#e6eaee] bg-white p-5 shadow-[0_24px_70px_-28px_rgba(11,29,51,0.35)] sm:p-7">
              <div className="flex items-center justify-between border-b border-[#e6eaee] pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#00a551]">
                    Cell Biology
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold">
                    Quick mastery check
                  </h2>
                </div>

                <span className="rounded-full bg-[#e9f8f0] px-3 py-1 text-xs font-bold text-[#02753a]">
                  AO2
                </span>
              </div>

              <div className="py-7">
                <p className="text-sm font-semibold text-[#5a6b7f]">
                  Question
                </p>

                <p className="mt-2 text-xl font-bold leading-8">
                  Explain how a root hair cell is adapted for absorbing mineral
                  ions from the soil.
                </p>

                <div className="mt-6 rounded-2xl border border-dashed border-[#b8c4ce] bg-[#f7f9fa] p-5">
                  <p className="text-sm leading-7 text-[#5a6b7f]">
                    Think about surface area, diffusion distance and the energy
                    needed for active transport.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#e6eaee] pt-5">
                <span className="text-sm font-semibold text-[#5a6b7f]">
                  3 marks
                </span>

                <span className="rounded-xl bg-[#0b1d33] px-5 py-3 text-sm font-bold text-white">
                  Reveal marking points
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="subjects"
        className="border-y border-[#e6eaee] bg-[#f7f9fa] py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-[#00a551]">
              AQA GCSE Biology
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Choose a Biology topic
            </h2>

            <p className="mt-4 leading-7 text-[#5a6b7f]">
              Practise all seven AQA Biology topics with structured mastery questions,
              marking points and progress tracking.
            </p>
          </div>

          <div className="mx-auto mt-8 flex justify-center">
            <Link
              href="/chemistry"
              className="rounded-xl bg-[#0b1d33] px-6 py-3 font-bold text-white transition hover:-translate-y-0.5"
            >
              Explore all 10 Chemistry topics
            </Link>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-2">
            {biologyTopics.map((topic) => (
              <article
                key={topic.id}
                className="flex flex-col justify-between rounded-3xl border border-[#e6eaee] bg-white p-6 shadow-sm sm:p-7"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#e9f8f0] px-3 py-1 text-xs font-bold text-[#02753a]">
                      {topic.topicNumber}
                    </span>
                    <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-bold text-[#5a6b7f]">
                      {topic.questions.length} questions
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-extrabold">{topic.title}</h3>
                  <p className="mt-2 leading-7 text-[#5a6b7f]">{topic.description}</p>
                </div>

                <Link
                  href={topic.route}
                  className="mt-6 inline-flex w-fit rounded-xl bg-[#00a551] px-6 py-3 font-bold text-white transition hover:bg-[#028f46]"
                >
                  Start {topic.title}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-[#00a551]">
              What ScienceMastery offers
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Revision built around exam success
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-[#e6eaee] bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f8f0] font-black text-[#02753a]">
                  {index + 1}
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#00a551]">
                  {feature.label}
                </p>

                <h3 className="mt-2 text-xl font-extrabold">{feature.title}</h3>

                <p className="mt-3 leading-7 text-[#5a6b7f]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b1d33] py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-[#5ee19c]">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              A simple mastery cycle
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-3xl border border-white/10 bg-white/5 p-7"
              >
                <span className="text-sm font-black text-[#5ee19c]">
                  {step.number}
                </span>

                <h3 className="mt-4 text-xl font-extrabold">{step.title}</h3>

                <p className="mt-3 leading-7 text-slate-300">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-[#00a551] py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Free, focused GCSE Science revision
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/90">
            ScienceMastery is being developed to give students free access to
            structured, exam-focused science practice.
          </p>

          <a
            href="#subjects"
            className="mt-8 inline-block rounded-xl bg-white px-7 py-3.5 font-bold text-[#02753a] shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            View the Biology prototype
          </a>
        </div>
      </section>

      <footer className="bg-[#071525] py-12 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00a551] text-white">
                  <FlaskIcon />
                </span>

                <span className="text-xl font-extrabold text-white">
                  Science<span className="text-[#5ee19c]">Mastery</span>
                </span>
              </div>

              <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                A free AQA GCSE Science revision platform built around mastery
                questions, exam intelligence and active recall.
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-sm font-bold text-white">Prototype scope</p>
              <p className="mt-3 text-sm text-slate-400">
                AQA GCSE Biology and Chemistry
              </p>
              <p className="mt-2 text-sm text-slate-400">
                17 topics and more than 1,000 mastery questions available.
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-xs text-slate-500">
            © 2026 ScienceMastery. Built for GCSE Science revision.
          </div>
        </div>
      </footer>
    </main>
  );
}