import { Sparkles, ArrowRight, BookOpen, Target, Clock, Download } from 'lucide-react';

export default function WelcomeScreen({ onStart }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-3xl mx-auto text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by DeepLearning.AI Curriculum
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Your Personalized
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Learning </span>
            Roadmap
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Answer a few questions and get a customized learning path from 100+ DeepLearning.AI courses,
            tailored to your goals, experience, and schedule.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Role-Based Paths</h3>
            <p className="text-sm text-slate-400">
              AI Engineer, Model Architect, or Enterprise Leader - find your path
            </p>
          </div>
          <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Paced Timeline</h3>
            <p className="text-sm text-slate-400">
              Realistic schedule based on your weekly availability
            </p>
          </div>
          <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Download className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Export & Share</h3>
            <p className="text-sm text-slate-400">
              Download your roadmap as PDF or share with others
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg rounded-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
        >
          <BookOpen className="w-5 h-5" />
          Start Your Journey
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="mt-6 text-slate-500 text-sm">
          Takes about 2 minutes • No signup required
        </p>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-800">
          <p className="text-slate-500 text-sm">
            Built by{' '}
            <a href="https://community.deeplearning.ai" className="text-blue-400 hover:underline">
              Learning Deep
            </a>
            {' '}for the DeepLearning.AI community
          </p>
        </div>
      </div>
    </div>
  );
}
