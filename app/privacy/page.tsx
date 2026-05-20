import { PublicShell } from "@/components/public/PublicShell";

export default function PrivacyPage() {
  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Privacy</h2>
              <p>Contact form submissions are stored as inquiries for authorized admins.</p>
            </div>
          </div>
          <div className="card">
            <p>
              Configure your production privacy policy with company-specific data handling,
              retention, analytics, and contact information before launch.
            </p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
