import React, { useState, useEffect, useRef } from 'react';
import AgoraLogo from '@/components/navigation/AgoraLogo';
import ImagePlaceholder from '@/components/common/ImagePlaceholder';
import {
  ShoppingBag,
  Package,
  TrendingUp,
  Receipt,
  ArrowRight,
  Check,
  ChevronDown,
  BookOpen,
  ArrowUpRight,
  Menu,
  X,
  Mail,
  ShieldCheck,
} from 'lucide-react';

interface LandingViewProps {
  onOpenAuth: (initialMode?: 'LOGIN' | 'SIGNUP') => void;
}

export default function LandingView({ onOpenAuth }: LandingViewProps) {
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Scroll Reveal Refs
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Detect system prefers-reduced-motion setting
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Sticky header background state listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsScrolledPastHero(true);
      } else {
        setIsScrolledPastHero(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for subtle scroll-reveal animations
  useEffect(() => {
    if (prefersReducedMotion) return; // Skip animations if user prefers reduced motion

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-6');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  const addSectionRef = (el: HTMLElement | null) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  };

  const faqs = [
    {
      q: 'How does Agora prevent sales and inventory drift?',
      a: 'In a paper notebook, sales are recorded separately from physical inventory checks. In Agora, every tap at checkout automatically subtracts the exact quantity from your inventory count and updates your daily net revenue total in real time.',
    },
    {
      q: 'What happens if internet cuts out during business hours?',
      a: 'Agora is engineered offline-first. Transactions, cart additions, and inventory edits save instantly to your browser local storage. When your connection returns, your local register syncs smoothly back to your database.',
    },
    {
      q: 'How are payment methods recorded at checkout?',
      a: 'Agora allows your register operator to record whether a transaction was completed via Cash, Mobile Money (e.g. Telebirr or CBE Birr), Card, or a Split payment across methods. At register closure, cash drawer totals can be reconciled against digital transfer logs.',
    },
    {
      q: 'Can I export transaction records for bookkeeping or tax filing?',
      a: 'Yes. Every completed sale, refunded receipt, and restock event is recorded in an immutable ledger exportable to standard CSV format anytime.',
    },
    {
      q: 'Is Agora free to use during early access?',
      a: 'Yes. During our open beta period, Agora is completely free for shop owners with no payment card required to create your store register.',
    },
  ];

  return (
    <div className="min-h-screen bg-agora-bg text-agora-ink selection:bg-agora-terracotta selection:text-agora-card flex flex-col font-sans">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-agora-terracotta focus:text-agora-card focus:rounded-xl font-bold text-xs focus:ring-2 focus:ring-agora-terracotta focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Dynamic Sticky Header with Safe-Area handling */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 pt-[env(safe-area-inset-top,0px)] ${
          isScrolledPastHero
            ? 'bg-agora-bg/95 border-b border-agora-border text-agora-ink backdrop-blur-md shadow-sm'
            : 'bg-agora-ink text-agora-card border-b border-white/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <AgoraLogo size="md" />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
            <a
              href="#features"
              className={`transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agora-terracotta focus-visible:ring-offset-2 rounded-lg px-2 py-1 ${
                isScrolledPastHero
                  ? 'text-agora-ink-muted hover:text-agora-ink'
                  : 'text-agora-card/70 hover:text-agora-card'
              }`}
            >
              Key Features
            </a>
            <a
              href="#problem"
              className={`transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agora-terracotta focus-visible:ring-offset-2 rounded-lg px-2 py-1 ${
                isScrolledPastHero
                  ? 'text-agora-ink-muted hover:text-agora-ink'
                  : 'text-agora-card/70 hover:text-agora-card'
              }`}
            >
              Why Agora
            </a>
            <a
              href="#faq"
              className={`transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agora-terracotta focus-visible:ring-offset-2 rounded-lg px-2 py-1 ${
                isScrolledPastHero
                  ? 'text-agora-ink-muted hover:text-agora-ink'
                  : 'text-agora-card/70 hover:text-agora-card'
              }`}
            >
              Questions
            </a>
          </nav>

          {/* Header Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenAuth('LOGIN')}
              className={`hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold rounded-xl min-h-[44px] items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agora-terracotta focus-visible:ring-offset-2 ${
                isScrolledPastHero
                  ? 'text-agora-ink hover:bg-agora-card'
                  : 'text-agora-card/80 hover:text-agora-card'
              }`}
            >
              Sign In
            </button>

            <button
              onClick={() => onOpenAuth('SIGNUP')}
              className="px-4 py-2.5 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card text-xs font-serif font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.98] min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agora-terracotta focus-visible:ring-offset-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-current min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agora-terracotta"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-agora-border bg-agora-card text-agora-ink p-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-xs font-bold text-agora-ink hover:text-agora-terracotta min-h-[44px] flex items-center"
            >
              Key Features
            </a>
            <a
              href="#problem"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-xs font-bold text-agora-ink hover:text-agora-terracotta min-h-[44px] flex items-center"
            >
              Why Agora
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-xs font-bold text-agora-ink hover:text-agora-terracotta min-h-[44px] flex items-center"
            >
              Questions
            </a>
            <div className="pt-2 border-t border-agora-border flex items-center gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('LOGIN');
                }}
                className="w-1/2 py-2.5 bg-agora-bg text-agora-ink font-bold text-xs rounded-xl border border-agora-border min-h-[44px]"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('SIGNUP');
                }}
                className="w-1/2 py-2.5 bg-agora-terracotta text-agora-card font-serif font-bold text-xs rounded-xl min-h-[44px]"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1">
        {/* 1. Hero Section (Bold Ink-Black Visual Opening) */}
        <section className="bg-agora-ink text-agora-card pt-12 pb-20 px-4 sm:px-8 border-b border-white/10 relative overflow-hidden">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />

          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Hero Column */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Eyebrow Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-semibold text-agora-card/90">
                <BookOpen className="w-3.5 h-3.5 text-agora-terracotta" />
                <span>Open Access Beta • Digital Trade Ledger</span>
              </div>

              {/* Fluid Responsive Headline */}
              <h1 className="text-[clamp(2.25rem,5vw,4rem)] font-serif font-bold tracking-tight text-agora-card leading-[1.12]">
                Stop sales and stock from drifting apart in a paper notebook.
              </h1>

              {/* Paragraph Measure (60-75ch limit) */}
              <p className="text-sm sm:text-base text-agora-card/80 leading-[1.6] max-w-[65ch]">
                Most small shop owners track sales on paper while inventory sits on shelves. When
                busy days hit, paper numbers drift out of sync with real stock. Agora connects your
                register taps directly to inventory counts, stock alerts, and daily net revenue.
              </p>

              {/* Value Proposition Bullets */}
              <ul className="space-y-2.5 text-xs font-semibold text-agora-card/90 pt-1">
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-agora-sage/20 text-agora-sage flex items-center justify-center border border-agora-sage/30 shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Automatic stock deduction on every recorded sale</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-agora-gold/20 text-agora-gold flex items-center justify-center border border-agora-gold/30 shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>
                    Dedicated gold warnings (
                    <code className="text-agora-gold font-mono font-bold">#C99A2E</code>) before
                    items sell out
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-agora-sage/20 text-agora-sage flex items-center justify-center border border-agora-sage/30 shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Offline-first storage — operates without internet</span>
                </li>
              </ul>

              {/* Dual Hero CTAs */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onOpenAuth('SIGNUP')}
                  className="px-6 py-3.5 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card text-sm font-serif font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 active:scale-[0.98] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agora-terracotta focus-visible:ring-offset-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#features"
                  className="px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-2xl text-sm font-semibold text-agora-card transition-all flex items-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agora-terracotta"
                >
                  <span>See how it works</span>
                  <ArrowUpRight className="w-4 h-4 text-agora-card/60" />
                </a>
              </div>
            </div>

            {/* Right Hero Column: Hero Image Placeholder (Phone/Tablet Frame) */}
            <div className="lg:col-span-6 animate-in fade-in zoom-in-95 duration-500">
              <ImagePlaceholder
                label="[Screenshot — Sell Screen: Tap-to-sell product grid & cart]"
                aspectRatio="16/11"
                altText="Screenshot placeholder of Agora's Sell screen showing the tap-to-sell product grid and running cart calculation"
                priority={true}
                deviceFrame="phone"
                darkTheme={true}
                className="shadow-2xl border-white/20"
              />
            </div>
          </div>
        </section>

        {/* 2. The Core Problem Section */}
        <section
          id="problem"
          ref={addSectionRef}
          className={`py-16 px-4 sm:px-8 max-w-7xl mx-auto w-full transition-all duration-500 ${
            prefersReducedMotion ? '' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-serif font-bold text-agora-ink">
              Why paper notebooks lead to inventory drift
            </h2>
            <p className="text-sm text-agora-ink-muted leading-[1.6] max-w-[65ch] mx-auto">
              When sales are written by hand while stock sits on shelves, three common operational
              problems occur every week:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-agora-card border border-agora-border rounded-2xl p-6 space-y-3 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 bg-agora-gold-light text-agora-gold rounded-xl flex items-center justify-center border border-agora-gold-border font-bold">
                1
              </div>
              <h3 className="font-serif font-bold text-base text-agora-ink">Untracked Stockouts</h3>
              <p className="text-xs text-agora-ink-muted leading-[1.6]">
                Items sell out during busy shifts, but because stock is checked manually at
                end-of-day, customers are turned away before anyone notices the empty shelf.
              </p>
            </div>

            <div className="bg-agora-card border border-agora-border rounded-2xl p-6 space-y-3 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 bg-agora-brick-light text-agora-brick rounded-xl flex items-center justify-center border border-agora-brick-border font-bold">
                2
              </div>
              <h3 className="font-serif font-bold text-base text-agora-ink">
                Cash Drawer Discrepancies
              </h3>
              <p className="text-xs text-agora-ink-muted leading-[1.6]">
                Cash receipts and mobile transfer text messages get mixed together. Without itemized
                transaction records, shift reconciliation takes over an hour at closing.
              </p>
            </div>

            <div className="bg-agora-card border border-agora-border rounded-2xl p-6 space-y-3 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 bg-agora-sage-light text-agora-sage rounded-xl flex items-center justify-center border border-agora-sage-border font-bold">
                3
              </div>
              <h3 className="font-serif font-bold text-base text-agora-ink">
                Zero Revenue Trend Insights
              </h3>
              <p className="text-xs text-agora-ink-muted leading-[1.6]">
                A notebook shows total cash collected, but hides which products generated the
                margin, which items expired, or whether weekly revenue is trending up or down.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Four Feature Sections (Zigzag Desktop Layout -> Single Column Mobile) */}
        <section
          id="features"
          className="py-12 bg-agora-card border-y border-agora-border space-y-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
            {/* Feature 1: Counter Register (Image Left, Text Right on Desktop) */}
            <div
              ref={addSectionRef}
              className={`grid lg:grid-cols-2 gap-10 lg:gap-14 items-center transition-all duration-500 ${
                prefersReducedMotion ? '' : 'opacity-0 translate-y-6'
              }`}
            >
              {/* Image Placeholder Always First on Mobile */}
              <div className="order-1">
                <ImagePlaceholder
                  label="[Screenshot — Sell Screen: Tap-to-sell grid, quick favorites, cart summary, and split cash/mobile payment options]"
                  aspectRatio="16/10"
                  altText="Screenshot placeholder of Agora's Sell screen showing the tap-to-sell product grid, pinned favorites, and payment method selection"
                  deviceFrame="desktop"
                />
              </div>

              <div className="order-2 space-y-4 text-left">
                <div className="w-10 h-10 bg-agora-terracotta/10 text-agora-terracotta rounded-xl flex items-center justify-center border border-agora-terracotta/20">
                  <ShoppingBag className="w-5 h-5" />
                </div>

                <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-serif font-bold text-agora-ink leading-tight">
                  Tap-to-Sell Register & Star Favorites
                </h2>

                <p className="text-xs sm:text-sm text-agora-ink-muted leading-[1.6] max-w-[60ch]">
                  Pin your highest-velocity items to the top of your register screen with a single
                  star toggle. Search products by title or category. Record payments in Cash, Mobile
                  Money (Telebirr/CBE Birr), Card, or Split tender.
                </p>

                <ul className="space-y-2 text-xs font-semibold text-agora-ink pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-agora-sage shrink-0" />
                    <span>Star-to-pin fast product layout</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-agora-sage shrink-0" />
                    <span>Record cash, mobile wallet, or split tender payments</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-agora-sage shrink-0" />
                    <span>Instant automatic stock deduction on sale completion</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 2: Stock Health & Gold Warnings (Text Left, Image Right on Desktop) */}
            <div
              ref={addSectionRef}
              className={`grid lg:grid-cols-2 gap-10 lg:gap-14 items-center transition-all duration-500 ${
                prefersReducedMotion ? '' : 'opacity-0 translate-y-6'
              }`}
            >
              {/* Text First on Desktop (order-1), Image Second (order-2). On Mobile: Image First via order-1/order-2 breakpoint override */}
              <div className="order-2 lg:order-1 space-y-4 text-left">
                <div className="w-10 h-10 bg-agora-gold-light text-agora-gold rounded-xl flex items-center justify-center border border-agora-gold-border">
                  <Package className="w-5 h-5" />
                </div>

                <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-serif font-bold text-agora-ink leading-tight">
                  Dedicated Gold Stock Warning Alerts
                </h2>

                <p className="text-xs sm:text-sm text-agora-ink-muted leading-[1.6] max-w-[60ch]">
                  Agora reserves warm gold (
                  <code className="text-agora-gold font-mono font-bold">#C99A2E</code>) strictly for
                  items reaching minimum thresholds or warning dates — keeping your eyes focused on
                  stock health before depletion occurs.
                </p>

                <ul className="space-y-2 text-xs font-semibold text-agora-ink pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-agora-sage shrink-0" />
                    <span>Custom low-stock threshold limit per product</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-agora-sage shrink-0" />
                    <span>One-tap stock replenishment drawer modal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-agora-sage shrink-0" />
                    <span>Expiry date tracking for perishable goods</span>
                  </li>
                </ul>
              </div>

              <div className="order-1 lg:order-2">
                <ImagePlaceholder
                  label="[Screenshot — Products View: Gold low-stock threshold badges (#C99A2E), restock drawer, and expiry date warnings]"
                  aspectRatio="16/10"
                  altText="Screenshot placeholder of Agora's Products view displaying gold stock warning badges, low-stock filter, and restock drawer modal"
                  deviceFrame="desktop"
                />
              </div>
            </div>

            {/* Feature 3: Sales History & Refunds (Image Left, Text Right on Desktop) */}
            <div
              ref={addSectionRef}
              className={`grid lg:grid-cols-2 gap-10 lg:gap-14 items-center transition-all duration-500 ${
                prefersReducedMotion ? '' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="order-1">
                <ImagePlaceholder
                  label="[Screenshot — Sales History View: Chronological receipt ledger, itemized breakdown, and void/refund flow]"
                  aspectRatio="16/10"
                  altText="Screenshot placeholder of Agora's Sales History view showing itemized receipts, transaction status, and refund flow"
                  deviceFrame="desktop"
                />
              </div>

              <div className="order-2 space-y-4 text-left">
                <div className="w-10 h-10 bg-agora-brick-light text-agora-brick rounded-xl flex items-center justify-center border border-agora-brick-border">
                  <Receipt className="w-5 h-5" />
                </div>

                <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-serif font-bold text-agora-ink leading-tight">
                  Sales History, Voids & Stock Restoration
                </h2>

                <p className="text-xs sm:text-sm text-agora-ink-muted leading-[1.6] max-w-[60ch]">
                  Review completed checkouts chronologically. Void mistaken taps or process customer
                  returns with automatic inventory quantity restoration and audit logs.
                </p>

                <ul className="space-y-2 text-xs font-semibold text-agora-ink pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-agora-sage shrink-0" />
                    <span>Itemized receipt inspection and customer lookup</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-agora-sage shrink-0" />
                    <span>Refund & void flow with automatic stock restoration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-agora-sage shrink-0" />
                    <span>Audit log of register changes and cash events</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 4: Reports & Reconciliation (Text Left, Image Right on Desktop) */}
            <div
              ref={addSectionRef}
              className={`grid lg:grid-cols-2 gap-10 lg:gap-14 items-center transition-all duration-500 ${
                prefersReducedMotion ? '' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="order-2 lg:order-1 space-y-4 text-left">
                <div className="w-10 h-10 bg-agora-sage-light text-agora-sage rounded-xl flex items-center justify-center border border-agora-sage-border">
                  <TrendingUp className="w-5 h-5" />
                </div>

                <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-serif font-bold text-agora-ink leading-tight">
                  Net Revenue Trends & CSV Audit Export
                </h2>

                <p className="text-xs sm:text-sm text-agora-ink-muted leading-[1.6] max-w-[60ch]">
                  Inspect daily net revenue metrics. The revenue line dynamically shifts to Sage
                  Green (<code className="text-agora-sage font-mono font-bold">#3B7A57</code>) for
                  net increases and Brick Red (
                  <code className="text-agora-brick font-mono font-bold">#C85A32</code>) for dips.
                </p>

                <ul className="space-y-2 text-xs font-semibold text-agora-ink pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-agora-sage shrink-0" />
                    <span>Continuous drag scrubbing revenue trendline chart</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-agora-sage shrink-0" />
                    <span>Register opening & closing cash drawer reconciliation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-agora-sage shrink-0" />
                    <span>One-click CSV receipt ledger export for tax filing</span>
                  </li>
                </ul>
              </div>

              <div className="order-1 lg:order-2">
                <ImagePlaceholder
                  label="[Screenshot — Reports View: Continuous drag-scrubbing revenue trendlines (Sage increase vs Brick dip), shift totals, and CSV export]"
                  aspectRatio="16/10"
                  altText="Screenshot placeholder of Agora's Reports view showing net revenue charts, shift totals, and CSV export action"
                  deviceFrame="desktop"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Early Access Section (Honest Closed/Open Beta Framing) */}
        <section
          ref={addSectionRef}
          className={`py-16 px-4 sm:px-8 max-w-5xl mx-auto w-full transition-all duration-500 ${
            prefersReducedMotion ? '' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="bg-agora-card border border-agora-border rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
            <div className="w-12 h-12 bg-agora-terracotta/10 text-agora-terracotta rounded-2xl flex items-center justify-center mx-auto border border-agora-terracotta/20">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-3 max-w-xl mx-auto">
              <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-serif font-bold text-agora-ink">
                Built for retail shop owners in open beta
              </h2>
              <p className="text-xs sm:text-sm text-agora-ink-muted leading-[1.6]">
                Agora is currently in early access open beta. You can set up your store register,
                add products, track sales offline, and export CSV logs today for free — with no
                credit card required.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onOpenAuth('SIGNUP')}
                className="px-6 py-3.5 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card text-sm font-serif font-bold rounded-2xl shadow transition-all flex items-center gap-2 active:scale-[0.98] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agora-terracotta focus-visible:ring-offset-2"
              >
                <span>Create Free Store Register</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* 5. FAQ Section (Grounded & Accessible Accordion) */}
        <section id="faq" className="py-16 px-4 sm:px-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-serif font-bold text-agora-ink">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-agora-ink-muted">
              Plain answers about how Agora operates in your store counter.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-agora-card border border-agora-border rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-agora-ink hover:bg-agora-bg/60 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agora-terracotta focus-visible:ring-offset-2"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-agora-ink-muted shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-agora-terracotta' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-agora-ink-muted leading-[1.6] border-t border-agora-border/40 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. Final Call to Action Section (Neutral Cream Background) */}
        <section className="py-16 px-4 sm:px-8 bg-agora-bg border-t border-agora-border text-center">
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-serif font-bold text-agora-ink">
              Ready to replace your paper sales notebook?
            </h2>
            <p className="text-xs sm:text-sm text-agora-ink-muted leading-[1.6]">
              Set up your store register, customize your product catalog, and keep sales and stock
              aligned from day one.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => onOpenAuth('SIGNUP')}
                className="px-6 py-3.5 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card text-sm font-serif font-bold rounded-2xl shadow transition-all flex items-center gap-2 active:scale-[0.98] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agora-terracotta focus-visible:ring-offset-2"
              >
                <span>Open Store Register Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-agora-card border-t border-agora-border px-4 sm:px-8 py-6 text-xs text-agora-ink-muted flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AgoraLogo size="sm" />
          <span>© {new Date().getFullYear()} Agora Digital Trade Ledger</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <a
            href="mailto:feedback@agora-pos.app"
            className="hover:text-agora-ink transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agora-terracotta rounded px-1"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send Beta Feedback</span>
          </a>
          <span className="text-agora-border">|</span>
          <span className="text-agora-ink-muted">Early Access Open Beta</span>
        </div>
      </footer>
    </div>
  );
}
