import Link from "next/link";

const subjects = [
  { name:"Biology", code:"AQA 8461", topics:7, questions:624, route:"/biology", colour:"var(--color-moss)", dark:"var(--color-moss-dark)", soft:"var(--color-moss-soft)", names:["Cell Biology","Organisation","Infection & Response","Bioenergetics","Homeostasis","Inheritance","Ecology"] },
  { name:"Chemistry", code:"AQA 8462", topics:10, questions:410, route:"/chemistry", colour:"var(--color-teal)", dark:"var(--color-teal-dark)", soft:"var(--color-teal-soft)", names:["Atomic Structure","Bonding","Quantitative","Chemical Changes","Energy","Rates","Organic","Analysis","Atmosphere","Resources"] },
  { name:"Physics", code:"AQA 8463", topics:8, questions:177, route:"/physics", colour:"var(--color-orange)", dark:"var(--color-orange-dark)", soft:"var(--color-orange-soft)", names:["Energy","Electricity","Particle Model","Atomic Structure","Forces","Waves","Magnetism","Space Physics"] },
];

const FlaskIcon = () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 3h6M10 3v6.3L4.8 18a3 3 0 0 0 2.7 4.4h9a3 3 0 0 0 2.7-4.4L14 9.3V3M7.5 15h9"/></svg>;

// Small hand-drawn style accent shapes echoing the illustrated reference deck.
const LeafDoodle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 60" className={className} fill="none" aria-hidden="true">
    <path d="M30 4C14 10 6 24 8 42c14 4 30-2 40-16 4-16-4-24-18-22Z" fill="var(--color-moss)" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M12 40C20 30 28 20 46 12" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const SpiralDoodle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 60" className={className} fill="none" aria-hidden="true">
    <path d="M30 44c-8 0-14-6-14-13s6-13 13-13 11 5 11 10-4 8-9 8-7-3-7-6 2-5 5-5" stroke="var(--color-moss)" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

export default function Home() {
  return <main className="min-h-screen bg-cream text-ink">
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink bg-orange text-white shadow-[3px_3px_0_0_var(--color-ink)]"><FlaskIcon/></span>
          <span className="font-display text-xl font-bold tracking-tight">Sci<span className="text-orange">Mastery</span></span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-bold text-ink-soft md:flex" aria-label="Main navigation">
          <a href="#subjects" className="hover:text-orange">Subjects</a>
          <a href="#features" className="hover:text-orange">Features</a>
          <a href="#how" className="hover:text-orange">How it works</a>
          <Link href="/challenge-me" className="hover:text-orange">Challenge Me</Link>
          <Link href="/practical-mode" className="hover:text-orange">Practical Lab</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-xl px-3 py-2.5 text-sm font-bold text-ink-soft hover:text-orange sm:block">Sign in</Link>
          <Link href="/signup" className="sm-btn bg-orange px-4 py-2.5 text-sm text-white">Create account</Link>
        </div>
      </div>
    </header>

    <section className="relative overflow-hidden border-b-2 border-ink bg-cream-soft">
      <LeafDoodle className="sm-scribble hidden h-16 w-16 -rotate-12 left-6 top-10 sm:block"/>
      <SpiralDoodle className="sm-scribble hidden h-14 w-14 right-10 top-24 lg:block"/>
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
        <div>
          <div className="sm-tag mb-6 px-3 py-1.5 text-xs">Free AQA GCSE Science revision</div>
          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">No matter which science you&apos;re studying, <span className="text-orange">we have you covered.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">Master Biology, Chemistry and Physics with 1,211 mastery questions, clear marking points, spaced review and progress tracking.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="sm-btn bg-orange px-6 py-3.5 text-white">Get started — it&apos;s free</Link>
            <a href="#sample" className="sm-btn bg-card px-6 py-3.5 text-ink">See a sample question</a>
          </div>
          <div className="mt-9 grid max-w-md grid-cols-3 gap-5">{[["1,211","questions"],["25","AQA topics"],["100%","free"]].map(([value,label])=><div key={label}><p className="font-display text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-ink-soft">{label}</p></div>)}</div>
        </div>
        <div id="sample" className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-5 rotate-3 rounded-[2rem] border-2 border-ink bg-yellow-soft"/>
          <div className="sm-panel relative p-7">
            <div className="flex gap-2"><span className="rounded-md border-2 border-ink bg-teal-soft px-3 py-1 text-xs font-bold text-teal-dark">Biology · Topic 3</span><span className="sm-tag px-3 py-1 text-xs">6 marks</span></div>
            <h2 className="mt-5 font-display text-xl font-semibold leading-8">Explain how vaccination gives an individual immunity.</h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-ink-soft"><p>✓ A vaccine contains dead or inactive pathogen material, or antigens.</p><p>✓ Antigens stimulate lymphocytes to produce specific antibodies.</p><p className="text-ink-soft/70">□ Memory cells remain…</p></div>
            <p className="mt-6 border-t-2 border-ink pt-5 text-sm font-bold text-orange-dark">AQA-style marking points</p>
          </div>
        </div>
      </div>
    </section>

    <section id="subjects" className="py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-orange-dark">Subjects</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">The complete AQA GCSE Science course</h2><p className="mt-4 text-ink-soft">Choose a subject, then practise any topic at your own pace.</p></div>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">{subjects.map(subject=><article key={subject.name} className="sm-panel flex flex-col overflow-hidden !p-0 transition hover:-translate-y-1">
        <div className="flex-1 p-7 border-b-2 border-ink" style={{backgroundColor:subject.soft}}>
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-ink text-white" style={{backgroundColor:subject.colour}}><FlaskIcon/></span>
            <span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold" style={{color:subject.dark}}>{subject.code}</span>
          </div>
          <h3 className="mt-5 font-display text-2xl font-bold">{subject.name}</h3>
          <p className="mt-2 text-sm text-ink-soft">{subject.topics} topics · {subject.questions} mastery questions</p>
          <div className="mt-5 flex flex-wrap gap-2">{subject.names.map(name=><span key={name} className="rounded-md border border-ink/40 bg-card px-2.5 py-1 text-xs font-semibold text-ink-soft">{name}</span>)}</div>
        </div>
        <div className="p-5"><Link href={subject.route} className="flex w-full items-center justify-center rounded-xl border-2 border-ink px-5 py-3 font-display font-semibold text-white" style={{backgroundColor:subject.colour}}>Explore {subject.name} →</Link></div>
      </article>)}</div>
    </div></section>

    <section id="features" className="border-y-2 border-ink bg-cream-soft py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-orange-dark">What we offer</p><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Everything you need to master GCSE Science</h2></div>
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[
        ["Recall","Active recall","Flip questions into flashcards and rate every answer.","/practice?mode=flashcards"],
        ["Mix","Targeted practice","Combine subjects, topics, tiers and assessment objectives.","/practice?mode=mixed"],
        ["Review","Spaced review","Clear questions due today in one cross-science queue.","/practice?mode=due"],
        ["Save","Bookmarking","Save difficult questions and revisit them whenever needed.","/practice?mode=bookmarks"],
        ["Connect","Challenge Me","Connect a whole topic to explain one real scenario.","/challenge-me"],
        ["Lab","Practical Lab Mode","Run every AQA required practical and its commonly asked questions.","/practical-mode"],
        ["Track","Progress tracking","See completion, weak topics and your recommended next step.","/dashboard"]
      ].map(([value,title,copy,route])=><Link href={route} key={title} className="sm-panel-sm block p-6 transition hover:-translate-y-1"><p className="font-display text-xl font-bold text-orange-dark">{value}</p><h3 className="mt-3 font-display text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-ink-soft">{copy}</p><span className="mt-4 inline-block text-sm font-bold text-orange-dark">Open →</span></Link>)}</div>
    </div></section>

    <section id="how" className="bg-ink py-20 text-cream"><div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-yellow">How it works</p><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">A simple mastery cycle</h2></div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">{[["01","Choose a topic","Start with the science and subtopic you need most."],["02","Answer from memory","Attempt each question before revealing the marking points."],["03","Check and improve","Rate your answer and return to difficult knowledge later."]].map(([n,title,copy])=><article key={n} className="rounded-2xl border-2 border-cream/20 bg-white/5 p-7"><span className="font-display text-2xl font-bold text-yellow">{n}</span><h3 className="mt-4 font-display text-xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-cream/70">{copy}</p></article>)}</div>
    </div></section>
    <footer className="border-t-2 border-cream/10 bg-ink py-10 text-cream/60"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-4 sm:flex-row sm:items-center sm:px-6"><div className="flex items-center gap-2.5 text-cream"><span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-cream/30 bg-orange"><FlaskIcon/></span><span className="font-display text-xl font-bold">Sci<span className="text-yellow">Mastery</span></span></div><p className="text-sm">Free AQA GCSE Biology, Chemistry and Physics revision.</p></div></footer>
  </main>;
}
