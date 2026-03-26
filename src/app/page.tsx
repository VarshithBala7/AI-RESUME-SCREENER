import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero">
        <div>
          <h1>AI Resume Screener</h1>
          <p>
            Upload your current resume and a job description, get an ATS match score, see missing
            keywords, and generate an ATS-optimized resume that you can download as PDF or Word.
          </p>
          <div className="actions">
            <Link className="btn btn-primary" href="/signup">
              Sign up
            </Link>
            <Link className="btn btn-secondary" href="/signin">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
