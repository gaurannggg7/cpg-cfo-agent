// TODO: replace with your real GitHub profile/repo URL.
const GITHUB_URL = 'https://github.com/gaurannggg7/cpg-cfo-agent';
// TODO: replace with your real LinkedIn profile URL.
const LINKEDIN_URL = 'https://www.linkedin.com/in/gaurang-mohan/';
// TODO: replace with your real contact email.
const CONTACT_EMAIL = 'gaurangmohan25@gmail.com';

export default function FooterCTA() {
  return (
    <footer className="py-40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-[family-name:var(--font-heading)] font-semibold text-4xl sm:text-5xl tracking-tight mb-6 text-[var(--text)]">
          Built to demonstrate how I engineer AI systems.
        </h2>
        <p className="text-[var(--text-dim)] text-base leading-relaxed mb-10">
          Currently looking for roles in software, backend, and AI/ML systems engineering.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-5 py-2.5 bg-[var(--text)] hover:bg-[var(--text)]/85 text-[var(--bg)] text-sm font-semibold rounded-[2px] transition-colors duration-200"
          >
            View GitHub
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-5 py-2.5 bg-[var(--text)] hover:bg-[var(--text)]/85 text-[var(--bg)] text-sm font-semibold rounded-[2px] transition-colors duration-200"
          >
            Connect on LinkedIn
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center px-5 py-2.5 border border-[var(--text)] text-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] text-sm font-semibold rounded-[2px] transition-colors duration-200"
          >
            Let&apos;s Talk
          </a>
        </div>
      </div>
    </footer>
  );
}
