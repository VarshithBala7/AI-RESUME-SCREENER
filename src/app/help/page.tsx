import { Navbar } from "@/components/navbar";
import { requireUser } from "@/lib/session";

export default async function HelpCenterPage() {
  const session = await requireUser();

  return (
    <main className="app-shell">
      <Navbar user={session.user} />
      <section className="page-content">
        <h1>Help Center</h1>
        <div className="card">
          <p>How to use AI Resume Screener:</p>
          <ol>
            <li>Go to Personal Dashboard and upload your resume file.</li>
            <li>Paste the complete job description in the text box.</li>
            <li>Run analysis to view match percentage and missing keywords.</li>
            <li>Generate ATS resume and download as DOCX or PDF.</li>
            <li>Access previous versions in Resume History.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
