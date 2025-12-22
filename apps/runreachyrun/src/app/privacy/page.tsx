import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { Metadata } from "next";
import { ResetCookieButton } from "./reset-button";

export const metadata: Metadata = {
  title: "Privacy & Cookies — runreachyrun",
  description: "Privacy policy and cookie information for runreachyrun.com",
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />

      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <header className="mb-12">
            <h1 className="font-mono text-3xl font-bold text-[var(--text-primary)] mb-4">
              Privacy & Cookies
            </h1>
            <p className="text-[var(--text-secondary)]">
              Last updated: December 2024
            </p>
          </header>

          <div className="prose-custom space-y-8">
            <section>
              <h2 className="font-mono text-xl font-semibold text-[var(--text-primary)] mb-4">
                Overview
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                runreachyrun.com is a personal project documenting the development of a Reachy Mini Lite robot.
                This site respects your privacy. We collect minimal data to understand how visitors use the site
                and improve the experience.
              </p>
            </section>

            <section>
              <h2 className="font-mono text-xl font-semibold text-[var(--text-primary)] mb-4">
                What We Collect
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                When you consent to cookies, we use Google Analytics to collect:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>Pages visited and time spent on each page</li>
                <li>Referral source (how you found the site)</li>
                <li>General location (country/region level)</li>
                <li>Device type and browser</li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                IP addresses are anonymized. We do not collect names, email addresses, or other personally
                identifiable information through analytics.
              </p>
            </section>

            <section>
              <h2 className="font-mono text-xl font-semibold text-[var(--text-primary)] mb-4">
                Cookies Used
              </h2>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--text-muted)]">
                      <th className="pb-2 font-mono">Cookie</th>
                      <th className="pb-2 font-mono">Purpose</th>
                      <th className="pb-2 font-mono">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--text-secondary)]">
                    <tr className="border-t border-[var(--border-subtle)]">
                      <td className="py-2 font-mono text-[var(--accent-cyan)]">_ga</td>
                      <td className="py-2">Distinguishes unique users</td>
                      <td className="py-2">2 years</td>
                    </tr>
                    <tr className="border-t border-[var(--border-subtle)]">
                      <td className="py-2 font-mono text-[var(--accent-cyan)]">_ga_*</td>
                      <td className="py-2">Persists session state</td>
                      <td className="py-2">2 years</td>
                    </tr>
                    <tr className="border-t border-[var(--border-subtle)]">
                      <td className="py-2 font-mono text-[var(--accent-cyan)]">cookie-consent</td>
                      <td className="py-2">Stores your cookie preference</td>
                      <td className="py-2">Persistent (localStorage)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-mono text-xl font-semibold text-[var(--text-primary)] mb-4">
                Your Choices
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                You can decline cookies when prompted, and the site will function normally without analytics tracking.
                To change your preference:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>Clear your browser&apos;s localStorage for this site</li>
                <li>Refresh the page to see the consent banner again</li>
              </ul>
              <div className="mt-4">
                <ResetCookieButton />
              </div>
            </section>

            <section>
              <h2 className="font-mono text-xl font-semibold text-[var(--text-primary)] mb-4">
                Third-Party Services
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                This site uses Google Analytics, which is operated by Google LLC. For information on how Google
                processes data, see{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-cyan)] hover:underline"
                >
                  Google&apos;s Privacy Policy
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-mono text-xl font-semibold text-[var(--text-primary)] mb-4">
                Data Retention
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Analytics data is retained in Google Analytics for 14 months, after which it is automatically deleted.
                We do not export or store analytics data elsewhere.
              </p>
            </section>

            <section>
              <h2 className="font-mono text-xl font-semibold text-[var(--text-primary)] mb-4">
                Contact
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Questions about this policy? Reach out via{" "}
                <a
                  href="https://twitter.com/bioinfo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-cyan)] hover:underline"
                >
                  Twitter
                </a>{" "}
                or open an issue on{" "}
                <a
                  href="https://github.com/BioInfo/reachy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-cyan)] hover:underline"
                >
                  GitHub
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
