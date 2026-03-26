import { getServerAuthSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <main className="container">
      <section className="card">
        <h1>Settings</h1>
        <p className="subtle">
          Configure account preferences, notification options, and integrations.
        </p>
        <ul className="bullet-list">
          <li>Enable/disable email notifications</li>
          <li>Manage connected social providers</li>
          <li>Update password and security options</li>
        </ul>
      </section>
    </main>
  );
}
