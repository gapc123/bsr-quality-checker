import { Link } from 'react-router-dom';
import { SignedIn } from '@clerk/clerk-react';
import { HeadlinesSection } from '../components/ContextSection';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Minimal Header */}
      <header className="relative border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                attlee.ai
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#problem" className="text-slate-400 hover:text-white transition-colors">
                Problem
              </a>
              <a href="#system" className="text-slate-400 hover:text-white transition-colors">
                System
              </a>
              <a href="#approach" className="text-slate-400 hover:text-white transition-colors">
                Approach
              </a>
            </nav>

            {/* CTA - Sign-in hidden from public, accessible via /sign-in URL */}
            <SignedIn>
              <Link
                to="/clients"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section - Maximum Impact, Minimum Words */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent" />

        <div className="relative max-w-5xl mx-auto px-4 py-32 sm:py-40">
          <div className="text-center space-y-12">
            {/* BSR Focus Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/30 rounded-full text-sm font-medium text-blue-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Building Safety Regulator · Gateway 2
            </div>

            {/* Provocative Statement */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-7xl font-bold text-white leading-tight tracking-tight">
                AI doesn't work for
                <br />
                regulatory compliance.
              </h1>

              <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-600 to-transparent mx-auto" />

              <h2 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                We built a system that does.
              </h2>
            </div>

            {/* Mission Statement */}
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto">
              Starting with BSR Gateway 2. Making high-risk building approvals faster and more certain.
            </p>

            {/* System Approach */}
            <p className="text-base text-slate-500">
              Deterministic rules. AI extraction. Expert oversight.
            </p>

            {/* Scroll Indicator */}
            <div className="pt-8">
              <div className="inline-flex flex-col items-center gap-2 text-slate-500 animate-bounce">
                <span className="text-xs uppercase tracking-wider">Explore</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Cards - Primary Click-Through Mechanism */}
      <section className="relative py-20 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">

            {/* Card 1: The Problem */}
            <NavigationCard
              id="problem"
              title="The Problem"
              description="Why the UK needs this now"
              detail="Housing delivery is too slow. Gateway approvals take months. The process is too complex."
              href="/problem"
              gradient="from-red-600/20 to-orange-600/20"
              borderGradient="from-red-500 to-orange-500"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />

            {/* Card 2: The System */}
            <NavigationCard
              id="system"
              title="The System"
              description="How it actually works"
              detail="55 deterministic rules mapped to Gateway 2. AI extracts evidence. Experts verify."
              href="/system"
              gradient="from-blue-600/20 to-cyan-600/20"
              borderGradient="from-blue-500 to-cyan-500"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              }
              featured
            />

            {/* Card 3: Why Different */}
            <NavigationCard
              id="approach"
              title="Why Different"
              description="Our competitive advantage"
              detail="AI for speed. Deterministic rules for certainty. Human experts for assurance."
              href="/approach"
              gradient="from-purple-600/20 to-pink-600/20"
              borderGradient="from-purple-500 to-pink-500"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Headlines Context - Preserved Carousel */}
      <HeadlinesSection />

      {/* Quick Links Section */}
      <section className="relative py-16 bg-slate-950 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center space-y-8">
            <p className="text-slate-500 text-sm uppercase tracking-wider">
              Or jump straight to
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:george@attlee.ai"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all border border-slate-700 hover:border-slate-600"
              >
                Book a Demo
              </a>
              <Link
                to="/security"
                className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors"
              >
                View Security Details →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="relative bg-slate-950 border-t border-slate-800/50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  attlee.ai
                </span>
              </div>
              <p className="text-sm text-slate-500">
                AI-powered building safety consultancy
              </p>
            </div>

            <div className="text-center md:text-right space-y-2">
              <p className="text-sm text-slate-500">
                <a href="mailto:george@attlee.ai" className="hover:text-blue-400 transition-colors">
                  george@attlee.ai
                </a>
              </p>
              <p className="text-xs text-slate-600">
                © 2026 attlee.ai
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Navigation Card Component
interface NavigationCardProps {
  id: string;
  title: string;
  description: string;
  detail: string;
  href: string;
  gradient: string;
  borderGradient: string;
  icon: React.ReactNode;
  featured?: boolean;
}

function NavigationCard({
  id,
  title,
  description,
  detail,
  href,
  gradient,
  borderGradient,
  icon,
  featured = false
}: NavigationCardProps) {
  return (
    <a
      id={id}
      href={href}
      className={`
        group relative block bg-slate-900 rounded-2xl overflow-hidden
        transition-all duration-300 hover:scale-105
        ${featured ? 'md:scale-105 shadow-2xl' : 'shadow-xl'}
        border border-slate-800 hover:border-slate-700
      `}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-70 transition-opacity`} />

      {/* Border Gradient Glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${borderGradient} blur-xl -z-10`} />

      {/* Content */}
      <div className="relative p-8 space-y-6">
        {/* Icon */}
        <div className={`
          w-12 h-12 rounded-xl bg-gradient-to-br ${borderGradient}
          flex items-center justify-center text-white
          group-hover:scale-110 transition-transform
        `}>
          {icon}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-400 font-medium">
            {description}
          </p>
        </div>

        {/* Detail Text */}
        <p className="text-slate-300 text-sm leading-relaxed">
          {detail}
        </p>

        {/* Arrow CTA */}
        <div className="flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors">
          <span className="text-sm font-medium">Learn more</span>
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>

      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-4 right-4">
          <div className="px-3 py-1 bg-cyan-600 text-white text-xs font-bold rounded-full shadow-lg">
            Core
          </div>
        </div>
      )}
    </a>
  );
}
