// TODO: replace with your real GitHub profile/repo URL.
const GITHUB_URL = 'https://github.com/TODO';
// TODO: replace with your real LinkedIn profile URL.
const LINKEDIN_URL = 'https://linkedin.com/in/TODO';
// TODO: replace with your real contact email.
const CONTACT_EMAIL = 'TODO@example.com';

export default function FooterCTA() {
  return (
    <footer className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl tracking-tight mb-4">
          <span className="bg-gradient-to-r from-white to-[#06B6D4] bg-clip-text text-transparent">
            Built to demonstrate how I engineer AI systems.
          </span>
        </h2>
        <p className="text-[#9CA3AF] text-base leading-relaxed mb-8">
          Currently looking for roles in software, backend, and AI/ML systems engineering.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold rounded-lg transition-colors duration-200"
          >
            View GitHub
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold rounded-lg transition-colors duration-200"
          >
            Connect on LinkedIn
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center px-5 py-2.5 border border-[#7C3AED] text-[#E2E8F0] hover:bg-[#7C3AED]/10 text-sm font-semibold rounded-lg transition-colors duration-200"
          >
            Let&apos;s Talk
          </a>
        </div>
      </div>
    </footer>
  );
}
