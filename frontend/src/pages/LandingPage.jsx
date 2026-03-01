import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { motion } from "framer-motion";
import {
  BookOpen,
  Shield,
  Users,
  Smile,
  Globe,
  PenLine,
  Zap,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  Star,
  Flame,
  Heart,
} from "lucide-react";
import logoImg from "../assets/dearly-logo.png";

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Opportunistic background ping to wake up free-tier Render backend
  React.useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      fetch(`${apiUrl}/health`, { mode: "no-cors" }).catch(() => {});
    }
  }, []);

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth?mode=signup");
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark font-display text-slate-900 dark:text-white selection:bg-primary-container selection:text-primary-dark overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 0: Sticky Navbar
          ───────────────────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={logoImg}
              alt="Dearly Logo"
              className="w-7 h-7 object-contain drop-shadow-sm"
            />
            <span className="font-black tracking-tight text-xl">Dearly</span>
          </div>
          <button
            onClick={handleCTA}
            className="group flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            Get Started
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 1: Hero Section
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Background Decorative Blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-primary/20 via-primary-container-dark/10 to-transparent rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse"></div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-3xl mx-auto z-10"
        >
          <div className="inline-block bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-8">
            Your Private Journal · Your Rules
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1]">
            Write what matters.
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Dearly is a private, beautiful journaling app. Capture your
            thoughts, track your mood, collaborate with trusted friends, and
            share anonymously with a community that cares.
          </p>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleCTA}
              className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-full text-lg font-black shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              Start Writing — It's Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-500">
              No credit card required · Private by default
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 2: Stats Bar
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-surface-variant-dark border-y border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white py-12 px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-200 dark:divide-slate-800">
          <div className="text-center px-4">
            <div className="text-3xl md:text-4xl font-black mb-1 flex items-center justify-center gap-3">
              <PenLine className="w-7 h-7 md:w-8 md:h-8 text-primary" /> 10,000+
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Entries Written
            </div>
          </div>
          <div className="text-center px-4">
            <div className="text-3xl md:text-4xl font-black mb-1 flex items-center justify-center gap-3">
              <Flame className="w-7 h-7 md:w-8 md:h-8 text-amber-500" /> 1,200+
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Active Writers
            </div>
          </div>
          <div className="text-center px-4">
            <div className="text-3xl md:text-4xl font-black mb-1 flex items-center justify-center gap-3">
              <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-blue-500" />{" "}
              4,500+
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Community Shares
            </div>
          </div>
          <div className="text-center px-4">
            <div className="text-3xl md:text-4xl font-black mb-1 flex items-center justify-center gap-3">
              <Star className="w-7 h-7 md:w-8 md:h-8 text-yellow-500 fill-yellow-500/20" />{" "}
              4.9/5
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              User Rating
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 3: Features Showcase
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-surface-dark relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Everything you need to write freely
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Beautiful, powerful features designed to get out of your way.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Shield,
                title: "Private by Default",
                desc: "Every entry starts private. You control what anyone ever sees.",
                color: "text-slate-700 dark:text-slate-300",
              },
              {
                icon: Smile,
                title: "Mood Tracking",
                desc: "Tag entries with your mood and watch your emotional patterns emerge over time.",
                color: "text-amber-500",
              },
              {
                icon: BookOpen,
                title: "Notebooks",
                desc: "Organize entries into themed notebooks. Invite collaborators to shared spaces.",
                color: "text-blue-500",
              },
              {
                icon: Globe,
                title: "Anonymous Community",
                desc: "Share thoughts anonymously and connect with others who relate — without revealing your identity.",
                color: "text-emerald-500",
              },
              {
                icon: PenLine,
                title: "Rich Text Editor",
                desc: "Format your thoughts with headings, lists, bold, italics, and more — powered by TipTap.",
                color: "text-rose-500",
              },
              {
                icon: Zap,
                title: "Real-Time Collaboration",
                desc: "Co-write entries in real-time with your team, seeing each other's cursors live.",
                color: "text-purple-500",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white dark:bg-surface-variant-dark rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-slate-50 dark:bg-surface-dark flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-800 ${feature.color}`}
                >
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 4: How It Works
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-primary/5 dark:bg-primary-container-dark/10 transform skew-y-3 -z-10 origin-top-left"></div>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Up and writing in minutes
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              No complicated setup. Just open Dearly and start.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-12 relative">
            <div className="hidden md:block absolute top-12 left-16 right-16 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 -z-10"></div>

            {[
              {
                step: 1,
                icon: PenLine,
                title: "Create your account",
                desc: "Sign up with email or Google. Takes 30 seconds.",
              },
              {
                step: 2,
                icon: BookOpen,
                title: "Write your first entry",
                desc: "Pick a mood, choose a template, or start with a blank page.",
              },
              {
                step: 3,
                icon: Star,
                title: "Grow your practice",
                desc: "Build streaks, organize notebooks, and optionally share with your community.",
              },
            ].map((item, i) => (
              <div key={i} className="flex-1 text-center relative">
                <div className="w-24 h-24 mx-auto bg-white dark:bg-surface-variant-dark rounded-full border-4 border-primary/20 dark:border-primary-container flex items-center justify-center shadow-xl mb-6 shadow-primary/10 relative z-10">
                  <item.icon className="w-10 h-10 text-primary dark:text-primary-container" />
                  <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm border-2 border-white dark:border-surface-dark shadow-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-black mb-3">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 5: Feature Deep Dives
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white dark:bg-surface-dark">
        <div className="max-w-6xl mx-auto flex flex-col gap-32">
          {/* Deep Dive A: Community */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
                Share anonymously.
                <br />
                Connect genuinely.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                Dearly's community feed lets you post your thoughts without your
                name attached. React and comment on others' stories. Build real
                connection through honest words.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Total privacy by default",
                  "Supportive reaction system",
                  "Safe space for vulnerability",
                ].map((itm, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                      <span className="text-xs">✓</span>
                    </div>
                    {itm}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative perspective-1000"
            >
              <div className="relative bg-white dark:bg-surface-variant-dark border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl rotate-y-[-5deg] rotate-x-[5deg] transform-style-3d">
                <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Anonymous</div>
                    <div className="text-xs text-slate-400">2 hours ago</div>
                  </div>
                </div>
                <h4 className="text-xl font-black mb-2">
                  Feeling overwhelmed but hopeful
                </h4>
                <div className="space-y-2 mb-6">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-4/6"></div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Support 24
                  </div>
                  <div className="bg-blue-500/10 text-blue-500 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> Relate 12
                  </div>
                </div>
                {/* Decorative blob */}
                <div className="absolute -z-10 -right-10 -bottom-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
              </div>
            </motion.div>
          </div>

          {/* Deep Dive B: Real-time Collab */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1 relative perspective-1000"
            >
              <div className="relative bg-white dark:bg-surface-variant-dark border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-2xl rotate-y-[5deg] rotate-x-[5deg] transform-style-3d">
                {/* Realtime collab mock UI */}
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-variant-dark bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                      P
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-variant-dark bg-rose-500 flex items-center justify-center text-white text-xs font-bold">
                      A
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-variant-dark bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                      J
                    </div>
                  </div>
                </div>

                <div className="relative text-lg font-serif leading-loose text-slate-700 dark:text-slate-300">
                  We decided to start a shared notebook for our trip to Japan.
                  <span className="relative inline-block ml-1 border-r-2 border-indigo-500 pr-0.5 animate-pulse">
                    It's going to be amazing
                    <span className="absolute -top-6 right-0 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded font-sans font-bold whitespace-nowrap">
                      Piyush
                    </span>
                  </span>
                </div>
                {/* Decorative blob */}
                <div className="absolute -z-10 -left-10 -bottom-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full"></div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
                Write together,
                <br />
                in real time.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                Invite people to your notebooks. See their cursor live. Whether
                it's a partner, friend, or team — co-writing in Dearly feels
                like sitting across a table.
              </p>
              <button
                onClick={handleCTA}
                className="text-primary font-bold text-lg hover:underline flex items-center gap-2"
              >
                Explore Notebooks <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 6: Quote Strip
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-6 bg-primary/5 dark:bg-primary/10 border-y border-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <svg
            className="w-12 h-12 mx-auto text-primary/40 mb-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <blockquote className="text-2xl md:text-4xl font-serif italic text-slate-800 dark:text-slate-200 leading-relaxed mb-8">
            "Your journal is the one place where no one judges, no one corrects
            — and everything counts."
          </blockquote>
          <cite className="text-lg font-bold text-slate-500 uppercase tracking-widest not-italic">
            — The Dearly Philosophy
          </cite>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 7: Final CTA Banner
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-indigo-600 -z-10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiLz48L3N2Zz4=')] opacity-50 -z-10"></div>

        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            The best time to start was yesterday. <br />
            <span className="text-amber-300">The second best time is now.</span>
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join thousands of writers finding clarity, connection, and peace of
            mind.
          </p>
          <button
            onClick={handleCTA}
            className="group bg-white text-slate-900 px-8 py-4 rounded-full text-xl font-black shadow-2xl hover:bg-slate-50 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3 mx-auto"
          >
            Start Your Journal
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 8: Footer
          ───────────────────────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-50 dark:bg-surface-dark text-slate-600 dark:text-slate-400 py-16 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
              <BookOpen className="w-8 h-8 text-primary" />
              <span className="font-black text-2xl tracking-tight">Dearly</span>
            </div>
            <p className="text-slate-500 max-w-xs mb-6">
              Write what matters. A safe, beautiful space for your thoughts,
              shared on your terms.
            </p>
            <p className="text-sm font-semibold">
              © {new Date().getFullYear()} Dearly. All rights reserved.
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-4 uppercase tracking-wider text-sm">
              Product
            </h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={handleCTA}
                  className="hover:text-primary transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={handleCTA}
                  className="hover:text-primary transition-colors"
                >
                  Community
                </button>
              </li>
              <li>
                <button
                  onClick={handleCTA}
                  className="hover:text-primary transition-colors"
                >
                  Notebooks
                </button>
              </li>
              <li>
                <span className="cursor-not-allowed opacity-50">
                  Pricing (Free)
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-4 uppercase tracking-wider text-sm">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <span className="cursor-not-allowed opacity-50">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="cursor-not-allowed opacity-50">
                  Terms of Service
                </span>
              </li>
              <li>
                <a
                  href="mailto:hello@dearly.app"
                  className="hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200 dark:border-slate-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-semibold text-slate-500 flex items-center justify-center md:justify-start gap-1">
            Built with <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />{" "}
            for writers everywhere.
          </p>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors cursor-pointer">
              𝕏
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors cursor-pointer">
              <span className="font-serif italic font-bold text-lg">in</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
