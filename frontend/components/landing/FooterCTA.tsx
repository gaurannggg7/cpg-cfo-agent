const GITHUB_URL = 'https://github.com/gaurannggg7/cpg-cfo-agent';
const LINKEDIN_URL = 'https://www.linkedin.com/in/gaurang-mohan/';
const CONTACT_EMAIL = 'gaurangmohan25@gmail.com';

export default function FooterCTA() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl">
          <h2 className="font-heading font-semibold text-3xl sm:text-4xl tracking-[-0.02em] text-text-primary text-balance mb-4">
            Built to demonstrate how I engineer AI systems.
          </h2>
          <p className="text-text-secondary text-base leading-relaxed mb-10">
            Currently looking for roles in software, backend, and AI/ML systems
            engineering.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-accent text-accent-foreground text-sm font-medium px-6 py-3 hover:bg-accent-hover transition-colors duration-200"
            >
              View GitHub
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              Connect on LinkedIn
              <span
                className="transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="group inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              Let&apos;s Talk
              <span
                className="transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </a>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-border flex items-center justify-between flex-wrap gap-2">
          <span className="font-mono text-xs text-text-muted">baseline</span>
          <span className="font-mono text-xs text-text-muted">
            Autonomous Financial Intelligence
          </span>
        </div>
      </div>
    </footer>
  );
}
