'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { Check, Clock, Code2, Users } from 'lucide-react';

interface LandingPageContentProps {
  totalRaised?: string;
  progressPct?: number;
}

const FEATURE_STRIP = [
  { icon: Check, bg: '#EAF6F0', iconColor: '#1AAE5A', title: 'No ads', desc: 'Your attention belongs to you.' },
  { icon: Clock, bg: '#F3F2FB', iconColor: '#7C3AED', title: 'No algorithms', desc: 'Chronological and transparent.' },
  { icon: Code2, bg: '#EEF0FF', iconColor: '#4F46E5', title: 'Open source', desc: 'Built in the open for the public good.' },
  { icon: Users, bg: '#EAF6F0', iconColor: '#1AAE5A', title: 'Everyone welcome', desc: 'Diverse views. Shared future.' },
];

const COMMUNITY_CARDS = [
  { emoji: '👥', title: 'Teams & Projects', bg: '#EAF6F0' },
  { emoji: '🏫', title: 'Schools & Universities', bg: '#F3F2FB' },
  { emoji: '🤝', title: 'Organizations', bg: '#EEF0FF' },
  { emoji: '🏛️', title: 'Governments', bg: '#EAF6F0' },
  { emoji: '💚', title: 'Nonprofits & Advocacy', bg: '#F3F2FB' },
  { emoji: '👪', title: 'Parent Groups', bg: '#EEF0FF' },
];

export function LandingPageContent({
  totalRaised: _totalRaised = '$500+',
  progressPct: _progressPct = 50,
}: LandingPageContentProps) {
  const router = useRouter();
  const user = useAppStore((state) => state.user.data);

  useEffect(() => {
    if (user?.id) {
      router.push('/dashboard/explore');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-white font-sans text-[#1A1A1A] overflow-x-hidden selection:bg-[#1AAE5A] selection:text-white" data-testid="landing-page">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="w-full pl-6 pr-6 xl:pl-[337px] xl:pr-[30px] py-4 flex items-center justify-between bg-white/92 border-b border-[#E5E5E5]">
        <Link href="/" className="flex items-center focus:outline-none group">
          <Image src="/assets/VoxPOPLogoHighres.png" alt="Quote.Vote logo" width={288} height={75} className="h-[75px] w-auto" />
        </Link>
        <div className="flex items-center gap-5">
          <Link href="https://github.com/quotevote/quotevote" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <Image src="/images/github-logo.png" alt="" width={61} height={61} className="w-[46px] h-[46px]" />
          </Link>
          <Link href="/auths/request-access" className="bg-gradient-to-r from-[#16A34A] to-[#1AAE5A] text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 ease-out">
            Request Invite
          </Link>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="max-w-[1037px] mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
        <div className="relative z-10">
          <h1 className="text-5xl md:text-[3rem] font-bold leading-[1.05] mb-8 tracking-tight text-[#1A1A1A]">
            Better conversations build <span className="text-[#1AAE5A]">stronger</span> <span className="text-[#4F46E5]">communities.</span>
          </h1>
          <p className="text-[17px] text-[#2A2A2A] mb-10 max-w-xl leading-[1.7]">
            Quote.Vote is a neutral public square for structured dialogue. Highlight what matters, vote on ideas, and find common ground across any divide.
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-12">
            <Link href="/auths/request-access" className="bg-gradient-to-r from-[#16A34A] to-[#1AAE5A] text-white px-8 py-3.5 rounded-full font-bold text-[15px] shadow-sm hover:shadow-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200 ease-out">
              Request Invite
            </Link>
            <Link href="/dashboard/explore" className="bg-white border border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white px-8 py-3.5 rounded-full font-bold text-[15px] shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 ease-out">
              Explore Discussions
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="relative w-[52px] h-[52px] rounded-full shadow-sm overflow-hidden shrink-0" style={{ backgroundColor: '#FF8E04' }}>
                <Image src="/images/avatars/avatar-5.svg" alt="" fill className="object-cover" />
              </div>
              <div className="relative w-[52px] h-[52px] rounded-full shadow-sm overflow-hidden shrink-0" style={{ backgroundColor: '#F4A7C0' }}>
                <Image src="/images/avatars/avatar-3.svg" alt="" fill className="object-cover" />
              </div>
              <div className="relative w-[52px] h-[52px] rounded-full shadow-sm overflow-hidden shrink-0" style={{ backgroundColor: '#5BA85B' }}>
                <Image src="/images/avatars/avatar-4.svg" alt="" fill className="object-cover" />
              </div>
              <div className="relative w-[52px] h-[52px] rounded-full shadow-sm overflow-hidden shrink-0" style={{ backgroundColor: '#E06C6C' }}>
                <Image src="/images/avatars/avatar-2.svg" alt="" fill className="object-cover" />
              </div>
            </div>
            <p className="text-[13px] text-[#2A2A2A] leading-snug">
              Join thousands of people building a better world—together.
            </p>
          </div>
        </div>

        {/* Hero Mockup */}
        <div className="relative w-full max-w-[777px] mx-auto lg:ml-auto mt-16 lg:mt-0">
          <Image
            src="/images/hero-post-card.png"
            alt="Product screenshot: a post card with vote counts and a reaction bubble"
            width={777}
            height={593}
            className="w-full h-auto"
            priority
          />
        </div>
      </section>

      {/* ── Put Specific Ideas To a Vote ──────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1037px] mx-auto text-center mb-20 px-6">
          <h2 className="font-montserrat font-bold text-4xl md:text-[34px] tracking-[0.25px] text-black">
            Put Specific Ideas <span className="text-[#04A85B]">To a Vote</span>
          </h2>
        </div>

        <div className="max-w-[1037px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          {/* Left Mockup */}
          <div className="pl-4">
            <Image
              src="/images/vote-card.png"
              alt="A post from Marta with a support/disagree toggle and three bullet points: vote on a post overall or specific statements, see how people respond to each point, make group decisions easier to understand"
              width={622}
              height={285}
              className="w-full h-auto"
            />
          </div>

          {/* Right: Follow Discussions */}
          <div className="relative pr-8 md:pr-0 mt-10 md:mt-0">
            <div className="relative w-full max-w-[549px]">
              <Image
                src="/images/quote-comments.png"
                alt="Comment thread showing replies from different users on a shared post"
                width={549}
                height={392}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>


      {/* ── Feature Strip ──────────────────────────────────────── */}
      <section className="max-w-[1037px] mx-auto px-6 mb-24">
        <div className="bg-white rounded-2xl border border-[#E5E5E5] flex flex-col md:flex-row">
          {FEATURE_STRIP.map((item, idx) => (
            <div key={item.title} className={`flex-1 p-8 flex flex-col items-center text-center ${idx !== FEATURE_STRIP.length - 1 ? 'border-b md:border-b-0 md:border-r border-dotted border-[#CCCCCC]' : ''}`}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: item.bg }}>
                <item.icon className="w-6 h-6" style={{ color: item.iconColor }} />
              </div>
              <h4 className="font-bold text-[15px] text-[#1A1A1A] mb-2">{item.title}</h4>
              <p className="text-[13px] text-[#555555] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Built for every community ──────────────────────── */}
      <section className="py-24 bg-white border-y border-[#E5E5E5]">
        <div className="max-w-[1037px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div className="max-w-xl">
              <p className="text-[11px] text-[#888888] font-bold tracking-[0.1em] uppercase mb-3">BUILT FOR EVERY COMMUNITY</p>
              <h2 className="text-4xl md:text-[34px] font-bold mb-4 tracking-tight text-[#1A1A1A]">Classrooms to a Global Townsquare</h2>
              <p className="text-[#555555] text-[15px] font-normal">Works wherever people need to listen, deliberate, and decide together.</p>
            </div>
            <Link href="/docs" className="bg-white border border-[#B0ABFF] text-[#6C63FF] font-normal px-8 py-3 rounded-[6px] hover:bg-[#F3F2FB] transition-colors shadow-sm whitespace-nowrap text-[13px]">
              Implementation Guide
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {COMMUNITY_CARDS.map((card) => (
              <div key={card.title} className="rounded-[24px] p-6 text-center" style={{ backgroundColor: card.bg }}>
                <div className="text-[54px] mb-4 leading-none">{card.emoji}</div>
                <h4 className="font-bold text-[12px] text-[#1A1A1A] leading-tight px-1">{card.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Private Conversations ──────────────────────────────── */}
      <section className="bg-[#F4F5F9] py-24">
        <div className="max-w-[1037px] mx-auto px-6 flex flex-col">
          {/* Left-Aligned Top Text */}
          <div className="text-left mb-16">
            <h3 className="font-bold text-[36px] tracking-[-0.01em] leading-[1.3] mb-4 text-[#1A1A1A]">
              Private conversations, add buddies by username
            </h3>
            <p className="text-[#2A2A2A] text-[18px] leading-[1.6]">
              Real conversations with real impact.
            </p>
          </div>

          {/* 2-Column Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Follow Discussions Text */}
            <div className="flex flex-col items-center text-center justify-center">
              <h4 className="font-montserrat font-bold text-[34px] tracking-[0.25px] leading-[1.2] mb-6">
                <span className="text-black">Follow</span> <span className="text-[#04A85B]">Discussions</span>
              </h4>
              <div className="font-roboto font-bold text-[18px] text-black leading-[28px]">
                <p>Every post becomes a chat.</p>
                <p>Keep up-to-date with your bookmarks list.</p>
              </div>
            </div>

            {/* Right: Image */}
            <div className="flex justify-center md:justify-center">
              <div className="w-full max-w-[549px]">
                <Image
                  src="/images/track-conversations.png"
                  alt="Track conversations"
                  width={549}
                  height={400}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Donation ─────────────────────────────────────────── */}
      <section className="bg-[#EAF6F0] py-24">
        <div className="max-w-[1037px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          {/* Col 1 */}
          <div className="flex flex-col text-left">
            <h3 className="text-[20px] font-bold mb-4 leading-[1.4] text-[#1A1A1A]">Join us in creating a truly<br />open and equal community.</h3>
            <p className="text-[13px] text-[#555555] mb-8 leading-[1.6] max-w-[90%]">
              Quote.Vote is a nonprofit, open-source platform.<br />Every contribution goes directly toward keeping<br />the service free and supporting communities.
            </p>
            <div className="flex items-center gap-4 mt-auto">
              <Image src="/images/globe-icon-1@3x.png" alt="Quote.Vote Globe" width={52} height={52} className="w-[52px] h-[52px] rounded-2xl flex-shrink-0 shadow-sm" />
              <Link href="/auths/request-access" className="bg-[#1AAE5A] text-white px-6 h-[52px] rounded-xl flex items-center justify-center text-[13px] font-bold shadow-sm hover:opacity-90 transition-colors whitespace-nowrap">
                Request Invite
              </Link>
            </div>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col items-center justify-center h-full pt-2">
            <h4 className="font-bold text-[18px] mb-6 text-[#1A1A1A] text-center">Please be in touch!</h4>
            <div className="flex w-full max-w-[280px] h-[48px] mb-4 rounded-[12px] overflow-hidden border-[1px] border-[#E5E5E5] focus-within:border-[#1AAE5A] focus-within:ring-1 focus-within:ring-[#1AAE5A]">
              <input type="email" placeholder="you@example.com" className="bg-transparent px-4 h-full text-[13px] text-[#2A2A2A] placeholder-[#A0A0A0] flex-1 focus:outline-none min-w-0" />
              <button className="bg-[#1AAE5A] text-white px-6 h-full text-[13px] font-bold hover:opacity-90 transition-colors flex-shrink-0">Subscribe</button>
            </div>
            <p className="text-[12px] text-[#888888] text-center leading-[1.6]">No spam, ever. Unsubscribe anytime.</p>
          </div>

          {/* Col 3 */}
          <div className="flex flex-col items-center justify-start text-center h-full">
            <div className="text-[28px] mb-3 leading-none">💚</div>
            <h4 className="font-bold text-[18px] mb-3 text-[#1A1A1A] leading-[1.4]">Help keep Quote.Vote<br />free for everyone.</h4>
            <p className="text-[12px] text-[#555555] mb-8 leading-[1.6] max-w-[85%] mx-auto">
              Your donation supports development,<br />moderation, and hosting.
            </p>
            <div className="w-full flex flex-col items-center gap-4 mt-auto">
              <Link href="https://opencollective.com/quotevote/donate" target="_blank" rel="noopener noreferrer" className="bg-[#6C2BD9] text-white px-10 h-[48px] flex items-center justify-center rounded-xl text-[13px] font-bold shadow-sm hover:opacity-90 transition-colors">
                Donate Today
              </Link>
              <Link href="/about" className="text-[11px] text-[#6C2BD9] hover:underline font-bold text-center">
                Learn more about donations →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Community Strip Image ─────────────────────────────────── */}
      <section className="bg-[#F0FDF4] w-full border-b border-gray-100 relative h-[220px] md:h-[400px] overflow-hidden">
        <Image 
          src="/images/community-strip-full-cropped.png" 
          alt="Community members" 
          fill
          className="object-cover md:object-contain object-bottom mix-blend-multiply"
          priority
        />
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="bg-[#0A1F44] text-white pt-16 pb-8">
        <div className="max-w-[1037px] mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 mb-16">
          {/* Logo & Description */}
          <div className="md:col-span-4 lg:col-span-4">
            <Link href="/" aria-label="Quote.Vote home" className="inline-block mb-4 group">
              <Image src="/images/globe-icon-1@3x.png" alt="Quote.Vote logo" width={80} height={80} className="w-[80px] h-[80px] rounded-[20px] shadow-md group-hover:scale-105 transition-transform" />
            </Link>
            <p className="text-[13px] font-normal text-[#8A99B0] leading-[1.6]">Quote.Vote<br />A neutral public square.<br />Powered by people.</p>
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <h4 className="font-bold text-[12px] uppercase tracking-[0.05em] mb-5 text-white">PLATFORM</h4>
            <ul className="space-y-3 text-[13px] text-[#8A99B0]">
              <li><Link href="/dashboard/explore" className="hover:text-white transition-colors">Explore</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="font-bold text-[12px] uppercase tracking-[0.05em] mb-5 text-white">ABOUT</h4>
            <ul className="space-y-3 text-[13px] text-[#8A99B0]">
              <li><Link href="/mission" className="hover:text-white transition-colors">Our Mission</Link></li>
              <li><Link href="/team" className="hover:text-white transition-colors">Team</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/press" className="hover:text-white transition-colors">Press</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="font-bold text-[12px] uppercase tracking-[0.05em] mb-5 text-white">RESOURCES</h4>
            <ul className="space-y-3 text-[13px] text-[#8A99B0]">
              <li><Link href="/docs" className="hover:text-white transition-colors">Docs</Link></li>
              <li><Link href="https://github.com/quotevote" className="hover:text-white transition-colors">GitHub</Link></li>
              <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-3">
             <Link href="/auths/request-access" className="bg-[#1AAE5A] text-white w-[160px] h-[48px] flex items-center justify-center rounded-[10px] text-[13px] font-semibold hover:opacity-90 transition-colors shadow-sm whitespace-nowrap">
               Request Invite
             </Link>
             <Link href="https://opencollective.com/quotevote/donate" target="_blank" rel="noopener noreferrer" className="bg-[#6C2BD9] text-white w-[160px] h-[48px] flex items-center justify-center rounded-[10px] text-[13px] font-semibold hover:opacity-90 transition-colors shadow-sm">
               Donate
             </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="max-w-[1037px] mx-auto px-6 border-t border-white/10 pt-6">
           <div className="text-[12px] font-normal text-[#64748B] w-full flex flex-col md:flex-row justify-between items-center gap-4">
             <p>© 2026 Quote.Vote. All rights reserved.</p>
             <p className="flex items-center gap-1">Quote.Vote made with <span>💚</span> on Earth</p>
           </div>
        </div>
      </footer>
    </div>
  );
}
