'use client';

import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import AuthBanner from '@/components/AuthBanner';
import Hero from '@/components/landing/Hero';
import Problem from '@/components/landing/Problem';
import Pipeline from '@/components/landing/Pipeline';
import Capabilities from '@/components/landing/Capabilities';
import Architecture from '@/components/landing/Architecture';
import Stack from '@/components/landing/Stack';
import FooterCTA from '@/components/landing/FooterCTA';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      {!user && <AuthBanner />}

      <Hero user={user} />
      <Problem />
      <Pipeline />
      <Capabilities />
      <Architecture />
      <Stack />
      <FooterCTA />
    </div>
  );
}
