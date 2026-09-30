import Link from "next/link";
import RequireAdmin from "@/components/admin/RequireAdmin";

export default function AdminHomePage() {
  return (
    <RequireAdmin>
      <main className="min-h-screen bg-cream px-4 py-10 text-ink sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">Admin</p>
          <h1 className="mt-2 font-display text-4xl font-bold">BrainSoma administration</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">Manage the published question bank that powers the student practice site.</p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Link href="/admin/questions" className="sm-panel block p-6 transition hover:-translate-y-1">
              <h2 className="font-display text-xl font-bold">Manage questions</h2>
              <p className="mt-2 text-sm leading-6 text-ink-soft">Search, filter, edit, publish/unpublish and delete questions.</p>
              <span className="mt-4 inline-block text-sm font-bold text-orange-dark">Open →</span>
            </Link>
            <Link href="/admin/questions/upload" className="sm-panel block p-6 transition hover:-translate-y-1">
              <h2 className="font-display text-xl font-bold">Upload a workbook</h2>
              <p className="mt-2 text-sm leading-6 text-ink-soft">Import an .xlsx file from the &quot;Website Upload&quot; worksheet, with a preview and validation before saving.</p>
              <span className="mt-4 inline-block text-sm font-bold text-orange-dark">Open →</span>
            </Link>
          </div>
        </div>
      </main>
    </RequireAdmin>
  );
}
