import Image from 'next/image';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const LandingPageHero = () => {
    return (
        <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6">
            <div className="w-full max-w-4xl space-y-12">
                {/* Hero Image Section */}
                <div className="flex justify-center">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#2AE6B2] to-[#27C4E1] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white rounded-full p-2">
                            <Image
                                src="/assets/QuoteVoteLogo.png"
                                alt="Quote.Vote Main Logo"
                                width={180}
                                height={180}
                                className="h-40 w-40 sm:h-48 sm:w-48 object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>

                {/* About Section Card */}
                <div id="about-section" className="scroll-mt-24 w-full">
                    <UICard className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2AE6B2] via-[#27C4E1] to-[#178BE1]"></div>
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0A2342] mb-4">
                                Welcome to Quote.Vote
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 text-center max-w-2xl mx-auto pb-10">
                            <p className="text-[#0A2342]/80 leading-relaxed text-sm sm:text-base">
                                Quote Vote is a non-for-profit project, and encourages users to donate their money or time, to be an active part of the change we&apos;d all like to see in the world.
                            </p>
                            <p className="text-[#0A2342]/80 leading-relaxed text-sm sm:text-base font-medium">
                                We understand the delicate balance between fostering freedom of expression and curbing harmful behavior.
                            </p>
                            <p className="text-[#0A2342]/80 leading-relaxed text-sm sm:text-base">
                                Our moderation policies aim to maximize the benefits of free speech while minimizing the potential for harm.
                            </p>
                            <p className="text-[#0A2342]/80 leading-relaxed text-sm sm:text-base italic">
                                We believe that thoughtful, respectful discourse leads to stronger communities and richer dialogue.
                            </p>
                        </CardContent>
                    </UICard>
                </div>
            </div>
        </main>
    );
};
