import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CPG CFO Agent',
  description: 'Agentic AI for financial decisions — LangGraph + Groq + Firebase',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
