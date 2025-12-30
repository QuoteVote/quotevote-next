'use client';

/**
 * InfoSections Component
 * 
 * Informational sections about the platform mission and values.
 * Migrated from Material UI to shadcn/ui components.
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { useMobileDetection } from '@/hooks/useResponsive';

const DONATE_URL = 'mailto:admin@quote.vote';

export function InfoSections() {
  // Section references for scrolling and animations
  const missionRef = useRef<HTMLDivElement>(null);
  const missionSectionRef = useRef<HTMLDivElement>(null);
  const textOnlyRef = useRef<HTMLDivElement>(null);
  const votesRef = useRef<HTMLDivElement>(null);
  const inviteRef = useRef<HTMLDivElement>(null);
  const moderationRef = useRef<HTMLDivElement>(null);

  // State for UI visibility and animations
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [missionVisible, setMissionVisible] = useState(false);
  const [textOnlyVisible, setTextOnlyVisible] = useState(false);
  const [votesVisible, setVotesVisible] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [moderationVisible, setModerationVisible] = useState(false);

  const isMobileDevice = useMobileDetection();

  // Animation for reveal effect
  const getAnimationStyle = (isVisible: boolean) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
    transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#mission') {
      missionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;

    // Show back-to-top after scrolling
    const onScrollForTop = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', onScrollForTop);

    // Fallback if IntersectionObserver not supported
    if (!('IntersectionObserver' in window)) {
      return () => window.removeEventListener('scroll', onScrollForTop);
    }

    // Observe each section for reveal animation
    const mapping = new Map<Element, () => void>();
    const observedItems = [
      { ref: missionSectionRef, setter: setMissionVisible },
      { ref: textOnlyRef, setter: setTextOnlyVisible },
      { ref: votesRef, setter: setVotesVisible },
      { ref: inviteRef, setter: setInviteVisible },
      { ref: moderationRef, setter: setModerationVisible },
    ];

    const ioOptions = {
      root: null, // viewport
      rootMargin: '0px 0px -1% 0px', // trigger slightly before element fully enters viewport
      threshold: 0.03, // ~3% visible to trigger
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const setter = mapping.get(entry.target);
          if (setter) {
            setter();
            observer.unobserve(entry.target);
          }
        }
      });
    }, ioOptions);

    // Start observing any mounted elements and record mapping
    observedItems.forEach(({ ref, setter }) => {
      if (ref.current) {
        mapping.set(ref.current, () => setter(true));
        observer.observe(ref.current);
      }
    });

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScrollForTop);
    };
  }, []);

  // Back-to-top behavior
  const scrollToTop = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Accessibility: skip link (visually hidden) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded"
      >
        Skip to main content
      </a>

      <main
        id="main-content"
        role="main"
        aria-label="Mission and Information"
        className="min-h-screen"
      >
        <div
          id="mission"
          ref={missionRef}
          className="max-w-[1400px] mx-auto px-4 py-8 md:py-16"
        >
          {/* Mission */}
          <div
            ref={missionSectionRef}
            className="py-8 md:py-10 px-4 md:px-24"
            style={getAnimationStyle(missionVisible)}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 flex items-center md:items-start justify-center md:justify-start">
                <h1 className="text-2xl md:text-[2.3rem] font-normal text-black m-0 md:mr-24 mb-4 md:mb-2 text-center md:text-left">
                  Mission
                </h1>
              </div>

              <div className="md:col-span-8">
                <blockquote className="italic text-base md:text-lg leading-relaxed my-2 md:my-4 py-4 md:py-5 px-4 md:px-5 border-l-4 border-[#52b274] bg-[#e8f5ed] rounded-r-[10px] text-[#2b5d3d] font-medium">
                  &quot;Quote.Vote aspires to be a commons; a catalyst for
                  consensus, not a contest for influence.&quot;
                </blockquote>

                <p className="text-sm md:text-base mb-3">
                  Quote.Vote is a platform for genuine, in-depth discussions. It
                  exists to protect and nurture civic discourse by creating a
                  digital space where quoting and voting can flourish—without
                  manipulation, algorithms, or advertising.
                </p>
                <p className="text-sm md:text-base mb-3">
                  In today&apos;s social media environment, quick posts, outrage
                  cycles, and engagement metrics dominate our attention. This
                  place offers a structural alternative, one that values writing
                  as a tool for reflection and conversation as a form of care.
                </p>
                <p className="text-sm md:text-base mb-3">
                  This is not a startup, but rather a public utility for
                  collective thought. It is designed to slow users down, not
                  speed them up. It invites people to read carefully, reflect
                  together, and vote deliberately.
                </p>
              </div>
            </div>

            <Separator className="mt-4 md:mt-6 bg-[#2b5d3d] opacity-20 h-[0.05rem]" />
          </div>

          {/* Deliberately Text-Only */}
          <div
            ref={textOnlyRef}
            className="py-8 md:py-10 px-4 md:px-24"
            style={getAnimationStyle(textOnlyVisible)}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 flex items-center md:items-start justify-center md:justify-start">
                <h1 className="text-2xl md:text-[2.3rem] font-normal text-black m-0 md:mr-24 mb-4 md:mb-2 text-center md:text-left">
                  Deliberately Text-Only
                </h1>
              </div>

              <div className="md:col-span-8">
                <blockquote className="italic text-base md:text-lg leading-relaxed my-2 md:my-4 py-4 md:py-5 px-4 md:px-5 border-l-4 border-[#52b274] bg-[#e8f5ed] rounded-r-[10px] text-[#2b5d3d] font-medium">
                  &quot;Every aspect of the platform is intentional. Every
                  constraint is a choice rooted in values.&quot;
                </blockquote>

                <p className="text-lg md:text-xl font-medium text-[#52b274] mb-3">
                  No videos. No images. No audio.
                </p>
                <p className="text-sm md:text-base mb-3">
                  Quotes are blocks of text that open public chatrooms called
                  Quote Rooms—structured conversations anchored in clarity, and
                  precise feedback.
                </p>
              </div>
            </div>

            <Separator className="mt-4 md:mt-6 bg-[#2b5d3d] opacity-20 h-[0.05rem]" />
          </div>

          {/* Votes */}
          <div
            ref={votesRef}
            className="py-8 md:py-10 px-4 md:px-24"
            style={getAnimationStyle(votesVisible)}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 flex items-center md:items-start justify-center md:justify-start">
                <h1 className="text-2xl md:text-[2.3rem] font-normal text-black m-0 md:mr-24 mb-4 md:mb-2 text-center md:text-left">
                  Votes, Not Likes
                </h1>
              </div>

              <div className="md:col-span-8">
                <p className="text-sm md:text-base mb-3">
                  At any time, a quote can be put to a vote that an author can
                  activate after submitting. Visitors choose to approve or
                  disagree with ideas. No likes. A quote vote can not be undone
                  after the toggle is clicked.
                </p>
              </div>
            </div>

            <Separator className="mt-4 md:mt-6 bg-[#2b5d3d] opacity-20 h-[0.05rem]" />
          </div>

          {/* Invite-only */}
          <div
            ref={inviteRef}
            className="py-8 md:py-10 px-4 md:px-24"
            style={getAnimationStyle(inviteVisible)}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 flex items-center md:items-start justify-center md:justify-start">
                <h1 className="text-2xl md:text-[2.3rem] font-normal text-black m-0 md:mr-24 mb-4 md:mb-2 text-center md:text-left">
                  Invite-Only Growth
                </h1>
              </div>

              <div className="md:col-span-8">
                <p className="text-sm md:text-base mb-3">
                  Posting and quoting are gated through a vouching system. Each
                  contributor takes responsibility for who they invite. The
                  growth rate is controlled to protect community culture and
                  avoid the pitfalls of viral scale.
                </p>
                <blockquote className="italic text-base md:text-lg leading-relaxed my-2 md:my-4 py-4 md:py-5 px-4 md:px-5 border-l-4 border-[#52b274] bg-[#e8f5ed] rounded-r-[10px] text-[#2b5d3d] font-medium">
                  &quot;Quoting and voting are available to all, but the power
                  to publish is earned through trust and intent.&quot;
                </blockquote>
              </div>
            </div>

            <Separator className="mt-4 md:mt-6 bg-[#2b5d3d] opacity-20 h-[0.05rem]" />
          </div>

          {/* Moderation */}
          <div
            ref={moderationRef}
            className="py-8 md:py-10 px-4 md:px-24"
            style={getAnimationStyle(moderationVisible)}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 flex items-center md:items-start justify-center md:justify-start">
                <h1 className="text-2xl md:text-[2.3rem] font-normal text-black m-0 md:mr-24 mb-4 md:mb-2 text-center md:text-left">
                  Civic Moderation by Reputation
                </h1>
              </div>

              <div className="md:col-span-8">
                <p className="text-sm md:text-base mb-3">
                  Moderation isn&apos;t algorithmic or top-down. It&apos;s shared.
                  Each use will be a crucial part of the moderation system, and
                  when invites are shared with others, the referred user&apos;s
                  behavior will impact reputation weighting. A user&apos;s invite
                  tree grows to define the type of user they are following code
                  of conducts and terms of service; downstream behavior reflects
                  upstream.
                </p>
                <p className="text-sm md:text-base mb-3">
                  Misconduct is a community responsibility. Every user is a
                  moderator. Officially appointed moderators are compensated by
                  the non-for profit entity that exchanges their time for
                  monetary reward. All community members are facilitators tasked
                  with protecting clarity about what is tolerated and what is
                  not.
                </p>
              </div>
            </div>

            <Separator className="mt-4 md:mt-6 bg-[#2b5d3d] opacity-20 h-[0.05rem]" />
          </div>
        </div>

        {/* Donate Section */}
        <section className="my-12 mx-4">
          <div className="flex flex-col items-center justify-center space-y-4 md:space-y-8">
            <div className="flex items-center justify-center gap-4">
              <Image
                src="/assets/donate-emoji-1.svg"
                alt="Donate Emoji 1"
                width={60}
                height={60}
                className="hidden md:block"
              />
              <div className="flex flex-col justify-center items-center text-center max-w-md">
                <p className="font-medium mb-4 text-base md:text-lg">
                  Quote.Vote is non-profit, open source, and donation-supported.
                </p>
                <p className="font-medium mb-4 text-base md:text-lg">
                  Our only funding comes from people like you.
                </p>

                <Button
                  variant="default"
                  className="font-medium text-lg"
                  onClick={() => {
                    window.location.href = DONATE_URL;
                  }}
                  size={isMobileDevice ? 'default' : 'lg'}
                >
                  Please Donate
                </Button>
              </div>
              <Image
                src="/assets/donate-emoji-2.svg"
                alt="Donate Emoji 2"
                width={60}
                height={60}
                className="hidden md:block"
              />
            </div>

            <Image
              src="/assets/group-image.svg"
              alt="Group"
              width={1200}
              height={400}
              className="w-full h-auto"
            />
          </div>
        </section>
      </main>

      {/* Back to Top floating button */}
      {showBackToTop && (
        <div
          className="fixed bottom-5 md:bottom-10 right-5 md:right-10 z-[1000]"
          style={{
            opacity: showBackToTop ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <Button
            onClick={scrollToTop}
            className="w-14 h-14 rounded-full bg-[#52b274] text-white shadow-[0_6px_20px_rgba(82,178,116,0.4)] transition-all duration-300 hover:translate-y-[-2px]"
            aria-label="Back to top"
          >
            <ChevronUp className="w-7 h-7" />
          </Button>
        </div>
      )}
    </>
  );
}

