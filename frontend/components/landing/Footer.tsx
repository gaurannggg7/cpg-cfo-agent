export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            Built by{' '}
            <span className="font-semibold text-zinc-700">Gaurang Mohan</span>
            {' · '}ASU CS 2026
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/gaurannggg7/cpg-cfo-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 font-medium"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/gaurang-mohan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 font-medium"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
