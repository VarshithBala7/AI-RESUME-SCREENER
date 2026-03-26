import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/session";
import { Navbar } from "@/components/navbar";

export default async function SettingsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect("/signin");

  return (
    <main className="container app-shell">
      <Navbar />
      <section className="card content-pane">
        <h1 className="section-title">Settings</h1>
        <p className="muted-text">
          Manage account preferences. This starter includes secure authentication and verified
          email, and can be extended with additional controls.
        </p>
        <ul>
          <li>Notification preferences (placeholder)</li>
          <li>Connected social providers overview</li>
          <li>Password and security settings</li>
        </ul>
      </section>
    </main>
  );
}
