import { ArrowRight, Cpu, Network, Zap, Download, GitBranch, Timer } from 'lucide-react';

// Decorative floating node component
function FloatingNode({ className, delay = 0 }) {
  return (
    <div
      className={`absolute w-3 h-3 rounded-full bg-[var(--node-cyan)] opacity-40 ${className}`}
      style={{
        animation: `float 6s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        boxShadow: '0 0 20px var(--node-cyan-dim)',
      }}
    />
  );
}

// Connection line SVG
function ConnectionLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--node-cyan)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--node-cyan)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--node-purple)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M 100 200 Q 300 100 500 300 T 900 200"
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="1"
        strokeDasharray="5,5"
      />
      <path
        d="M 50 400 Q 250 300 450 500 T 850 400"
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="1"
        strokeDasharray="5,5"
      />
    </svg>
  );
}

export default function WelcomeScreen({ onStart }) {
  return (
    <div className="min-h-screen neural-bg relative overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Connection lines decoration */}
      <ConnectionLines />

      {/* Floating nodes decoration */}
      <FloatingNode className="top-[15%] left-[10%]" delay={0} />
      <FloatingNode className="top-[25%] right-[15%]" delay={1.5} />
      <FloatingNode className="bottom-[30%] left-[20%]" delay={3} />
      <FloatingNode className="bottom-[20%] right-[25%]" delay={0.8} />
      <FloatingNode className="top-[60%] left-[5%]" delay={2.2} />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm">
              <Cpu className="w-4 h-4 text-[var(--node-cyan)]" />
              <span className="font-mono text-sm text-[var(--text-secondary)]">
                115+ DeepLearning.AI Courses
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-bold text-center mb-6 leading-tight">
            <span className="text-[var(--text-primary)]">Your</span>
            <br />
            <span className="gradient-text-cyan">Learning Roadmap</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-[var(--text-secondary)] text-center max-w-2xl mx-auto mb-12 leading-relaxed">
            Answer 8 questions. Get a personalized roadmap.
            <br />
            <span className="text-[var(--text-muted)]">
              Built for the DeepLearning.AI community.
            </span>
          </p>

          {/* CTA Button */}
          <div className="flex justify-center mb-16">
            <button
              onClick={onStart}
              className="btn-primary group flex items-center gap-3 text-lg"
            >
              <Network className="w-5 h-5" />
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Feature cards - asymmetric grid */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {/* Card 1 - larger */}
            <div className="card-neural p-6 md:col-span-2">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[var(--node-cyan-dim)] flex items-center justify-center flex-shrink-0">
                  <GitBranch className="w-6 h-6 text-[var(--node-cyan)]" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-[var(--text-primary)] mb-1">
                    Three Specialized Tracks
                  </h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    AI Product Engineer, Model Architect, or Enterprise Leader.
                    Each path optimized for real-world outcomes.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="card-neural p-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--node-coral-dim)] flex items-center justify-center mb-3">
                <Timer className="w-5 h-5 text-[var(--node-coral)]" />
              </div>
              <h3 className="font-display font-semibold text-[var(--text-primary)] mb-1">
                Paced Timeline
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Weeks, not months. Realistic scheduling.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card-neural p-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--node-purple)]/20 flex items-center justify-center mb-3">
                <Download className="w-5 h-5 text-[var(--node-purple)]" />
              </div>
              <h3 className="font-display font-semibold text-[var(--text-primary)] mb-1">
                Export & Share
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">
                PDF download. Shareable links.
              </p>
            </div>

            {/* Card 4 */}
            <div className="card-neural p-6 md:col-span-2">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[var(--node-amber)]/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-[var(--node-amber)]" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-[var(--text-primary)] mb-1">
                    Smart Sequencing
                  </h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    Prerequisites handled automatically. Start from your current level.
                    Skip what you already know.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-[var(--text-muted)] text-sm font-mono">
            Built by{' '}
            <a
              href="https://community.deeplearning.ai/u/learningdeep/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--node-cyan)] hover:underline"
            >
              Learning Deep
            </a>
            {' '}// 2 min // No signup
          </p>
        </div>
      </div>
    </div>
  );
}
