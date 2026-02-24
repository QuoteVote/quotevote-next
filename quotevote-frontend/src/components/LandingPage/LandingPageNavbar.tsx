'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export const LandingPageNavbar = () => {
    const router = useRouter();

    const scrollToAbout = () => {
        const aboutSection = document.getElementById('about-section');
        if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-transparent shadow-sm" style={{ borderImage: 'linear-gradient(90deg, #2AE6B2, #27C4E1, #178BE1) 1' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 sm:h-20 lg:h-16 flex-col sm:flex-row gap-4 sm:gap-0 py-4 sm:py-0">
                    {/* Logo */}
                    <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
                        <Image
                            src="/assets/QuoteVoteLogo.png"
                            alt="Quote.Vote Logo"
                            width={40}
                            height={40}
                            className="h-10 w-10"
                        />
                        <span className="ml-2 text-xl font-extrabold tracking-wider text-[#0A2342]">
                            QUOTE.VOTE
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <Button
                            variant="ghost"
                            className="text-[#0A2342] font-medium hover:bg-[#2AE6B2]/10 transition-all w-full sm:w-auto"
                            onClick={() => router.push('/')}
                        >
                            Home
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-[#0A2342] font-medium hover:bg-[#2AE6B2]/10 transition-all w-full sm:w-auto"
                            onClick={scrollToAbout}
                        >
                            About
                        </Button>
                        <Button
                            variant="ghost"
                            asChild
                            className="text-[#0A2342] font-medium hover:bg-[#2AE6B2]/10 transition-all w-full sm:w-auto"
                        >
                            <a
                                href="https://opencollective.com/quotevote-duplicate/donate"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Donate
                            </a>
                        </Button>
                        <Button
                            variant="outline"
                            className="border-2 border-[#2AE6B2] text-[#0A2342] font-semibold hover:bg-[#2AE6B2]/10 transition-all w-full sm:w-auto"
                            onClick={() => router.push('/auth/login')}
                        >
                            Login
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-[#2AE6B2] to-[#27C4E1] text-white font-semibold hover:from-[#27C4E1] hover:to-[#178BE1] hover:-translate-y-0.5 shadow-sm hover:shadow-[0_4px_12px_rgba(42,230,178,0.3)] transition-all w-full sm:w-auto"
                            onClick={() => router.push('/auth/request-access')}
                        >
                            Request Invite
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
