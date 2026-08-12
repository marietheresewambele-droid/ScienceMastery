import Link from "next/link";

const subjects = [
  { name:"Biology", code:"AQA 8461", topics:7, questions:624, route:"/biology", colour:"#00a551", soft:"#e9f8f0", names:["Cell Biology","Organisation","Infection & Response","Bioenergetics","Homeostasis","Inheritance","Ecology"] },
  { name:"Chemistry", code:"AQA 8462", topics:10, questions:410, route:"/chemistry", colour:"#7c5cfc", soft:"#efecfd", names:["Atomic Structure","Bonding","Quantitative","Chemical Changes","Energy","Rates","Organic","Analysis","Atmosphere","Resources"] },
  { name:"Physics", code:"AQA 8463", topics:8, questions:177, route:"/physics", colour:"#3b82f6", soft:"#e8f2fc", names:["Energy","Electricity","Particle Model","Atomic Structure","Forces","Waves","Magnetism","Space Physics"] },
];

const FlaskIcon = () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 3h6M10 3v6.3L4.8 18a3 3 0 0 0 2.7 4.4h9a3 3 0 0 0 2.7-4.4L14 9.3V3M7.5 15h9"/></svg>;

export default function Home() {
  return <main className="min-h-screen bg-white text-[#0f1f3d]">
    <header className="sticky top-0 z-50 border-b border-[#e7eaf0] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00a551] text-white"><FlaskIcon/></span><span className="text-xl font-extrabold tracking-tight">Sci<span className="text-[#00a551]">Mastery</span></span></Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-[#5a6b82] md:flex" aria-label="Main navigation"><a href="#subjects">Subjects</a><a href="#features">Features</a><a href="#how">How it works</a></nav>
        <div className="flex items-center gap-2"><Link href="/login" className="hidden rounded-xl px-3 py-2.5 text-sm font-bold text-[#5a6b82] hover:text-[#00a551] sm:block">Sign in</Link><Link href="/signup" className="rounded-xl bg-[#00a551] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#028f46]">Create account</Link></div>
      </div>
    </header>

    <section className="overflow-hidden bg-gradient-to-b from-[#e9f8f0]/70 via-white to-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#e9f8f0] px-3 py-1.5 text-xs font-bold text-[#02753a]"><span className="h-2 w-2 rounded-full bg-[#00a551]"/>Free AQA GCSE Science revision</div>
          <h1 className="text-4xl font-black leading-[1.06] tracking-tight sm:text-5xl xl:text-6xl">No matter which science you&apos;re studying, <span className="text-[#00a551]">we have you covered.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5a6b82]">Master Biology, Chemistry and Physics with 1,211 mastery questions, clear marking points, spaced review and progress tracking.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/signup" className="rounded-xl bg-[#00a551] px-6 py-3.5 font-bold text-white hover:bg-[#028f46]">Get started — it&apos;s free</Link><a href="#sample" className="rounded-xl border border-[#e7eaf0] bg-white px-6 py-3.5 font-bold hover:border-[#00a551]">See a sample question</a></div>
          <div className="mt-9 grid max-w-md grid-cols-3 gap-5">{[["1,211","questions"],["25","AQA topics"],["100%","free"]].map(([value,label])=><div key={label}><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs text-[#5a6b82]">{label}</p></div>)}</div>
        </div>
        <div id="sample" className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-5 rotate-3 rounded-[2rem] bg-[#d3f1e1]"/>
          <div className="relative rounded-[2rem] border border-[#e7eaf0] bg-white p-7 shadow-[0_24px_70px_-28px_rgba(15,31,61,.35)]">
            <div className="flex gap-2"><span className="rounded-full bg-[#e9f8f0] px-3 py-1 text-xs font-bold text-[#02753a]">Biology · Topic 3</span><span className="rounded-full bg-[#f2f5f9] px-3 py-1 text-xs font-bold text-[#5a6b82]">6 marks</span></div>
            <h2 className="mt-5 text-xl font-extrabold leading-8">Explain how vaccination gives an individual immunity.</h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-[#5a6b82]"><p>✓ A vaccine contains dead or inactive pathogen material, or antigens.</p><p>✓ Antigens stimulate lymphocytes to produce specific antibodies.</p><p className="text-[#9aa6b5]">□ Memory cells remain…</p></div>
            <p className="mt-6 border-t border-[#e7eaf0] pt-5 text-sm font-bold text-[#00a551]">AQA-style marking points</p>
          </div>
        </div>
      </div>
    </section>

    <section id="subjects" className="py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-[#00a551]">Subjects</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">The complete AQA GCSE Science course</h2><p className="mt-4 text-[#5a6b82]">Choose a subject, then practise any topic at your own pace.</p></div>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">{subjects.map(subject=><article key={subject.name} className="flex flex-col overflow-hidden rounded-3xl border border-[#e7eaf0] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
        <div className="flex-1 p-7" style={{backgroundColor:subject.soft}}><div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{backgroundColor:subject.colour}}><FlaskIcon/></span><span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold" style={{color:subject.colour}}>{subject.code}</span></div>
          <h3 className="mt-5 text-2xl font-black">{subject.name}</h3><p className="mt-2 text-sm text-[#5a6b82]">{subject.topics} topics · {subject.questions} mastery questions</p><div className="mt-5 flex flex-wrap gap-2">{subject.names.map(name=><span key={name} className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-[#5a6b82]">{name}</span>)}</div>
        </div><div className="border-t border-[#e7eaf0] p-5"><Link href={subject.route} className="flex w-full items-center justify-center rounded-xl px-5 py-3 font-bold text-white" style={{backgroundColor:subject.colour}}>Explore {subject.name} →</Link></div>
      </article>)}</div>
    </div></section>

    <section id="features" className="bg-[#f7f9fb] py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-[#00a551]">What we offer</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Everything you need to master GCSE Science</h2></div>
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">{[
        ["Recall","Active recall","Flip questions into flashcards and rate every answer.","/practice?mode=flashcards"],
        ["Mix","Targeted practice","Combine subjects, topics, tiers and assessment objectives.","/practice?mode=mixed"],
        ["Review","Spaced review","Clear questions due today in one cross-science queue.","/practice?mode=due"],
        ["Save","Bookmarking","Save difficult questions and revisit them whenever needed.","/practice?mode=bookmarks"],
        ["Track","Progress tracking","See completion, weak topics and your recommended next step.","/dashboard"]
      ].map(([value,title,copy,route])=><Link href={route} key={title} className="rounded-3xl border border-[#e7eaf0] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><p className="text-xl font-black text-[#00a551]">{value}</p><h3 className="mt-3 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#5a6b82]">{copy}</p><span className="mt-4 inline-block text-sm font-bold text-[#00a551]">Open →</span></Link>)}</div>
    </div></section>

    <section id="how" className="bg-[#0f1f3d] py-20 text-white"><div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-[#5ee19c]">How it works</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">A simple mastery cycle</h2></div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">{[["01","Choose a topic","Start with the science and subtopic you need most."],["02","Answer from memory","Attempt each question before revealing the marking points."],["03","Check and improve","Rate your answer and return to difficult knowledge later."]].map(([n,title,copy])=><article key={n} className="rounded-3xl border border-white/10 bg-white/5 p-7"><span className="font-black text-[#5ee19c]">{n}</span><h3 className="mt-4 text-xl font-extrabold">{title}</h3><p className="mt-3 leading-7 text-slate-300">{copy}</p></article>)}</div>
    </div></section>
    <footer className="bg-[#071525] py-10 text-slate-400"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-4 sm:flex-row sm:items-center sm:px-6"><div className="flex items-center gap-2.5 text-white"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00a551]"><FlaskIcon/></span><span className="text-xl font-extrabold">Sci<span className="text-[#5ee19c]">Mastery</span></span></div><p className="text-sm">Free AQA GCSE Biology, Chemistry and Physics revision.</p></div></footer>
  </main>;
}
