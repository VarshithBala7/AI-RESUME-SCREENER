import { Navbar } from "@/components/navbar";
import { requireUser } from "@/lib/session";

export default async function HelpCenterPage() {
  await requireUser();

  return (
    <main className="container app-shell">
      <Navbar />
      <section className="card content-pane">
        <h1>Help Center</h1>
        <p className="muted-text">How to use AI Resume Screener effectively:</p>
        <ol>
          <li>Go to Personal Dashboard and upload your resume file.</li>
          <li>Paste the complete job description in the text box.</li>
          <li>Run analysis to view match percentage and missing keywords.</li>
          <li>Generate ATS resume and download as DOCX or PDF.</li>
          <li>Access previous versions in Resume History.</li>
        </ol>
      </section>
    </main>
  );
}
