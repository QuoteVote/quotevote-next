import Link from 'next/link';
import { Mail, Github, Twitter, Linkedin } from 'lucide-react';

export const LandingPageFooter = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-br from-[#0A2342] to-[#1a3a5c] text-white py-12 lg:py-16 mt-20" role="contentinfo">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* About Section */}
                    <div className="space-y-4">
                        <h3 className="text-[#2AE6B2] text-lg font-bold">About</h3>
                        <p className="text-white/80 text-sm italic">
                            Empowering thoughtful discourse and community engagement through democratic quote voting.
                        </p>
                        <a
                            href="mailto:admin@quote.vote"
                            className="flex items-center text-white hover:text-[#2AE6B2] transition-all text-sm group"
                            aria-label="Contact us via email"
                        >
                            <Mail className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                            admin@quote.vote
                        </a>
                    </div>

                    {/* Quick Links Section */}
                    <div className="space-y-4">
                        <h3 className="text-[#2AE6B2] text-lg font-bold">Quick Links</h3>
                        <div className="flex flex-col space-y-2">
                            <Link href="/auth/request-access" className="text-white/90 hover:text-[#2AE6B2] hover:translate-x-1 transition-all text-sm">
                                Request Invite
                            </Link>
                            <Link href="/auth/login" className="text-white/90 hover:text-[#2AE6B2] hover:translate-x-1 transition-all text-sm">
                                Login
                            </Link>
                            <a
                                href="https://opencollective.com/quotevote-duplicate/donate"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/90 hover:text-[#2AE6B2] hover:translate-x-1 transition-all text-sm"
                            >
                                Donate
                            </a>
                            <a
                                href="mailto:admin@quote.vote"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/90 hover:text-[#2AE6B2] hover:translate-x-1 transition-all text-sm"
                            >
                                Volunteer
                            </a>
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div className="space-y-4">
                        <h3 className="text-[#2AE6B2] text-lg font-bold">Resources</h3>
                        <div className="flex flex-col space-y-2">
                            <Link href="/TERMS.md" className="text-white/90 hover:text-[#2AE6B2] hover:translate-x-1 transition-all text-sm">
                                Terms of Service
                            </Link>
                            <Link href="/quote_vote_code_of_conduct.md" className="text-white/90 hover:text-[#2AE6B2] hover:translate-x-1 transition-all text-sm">
                                Code of Conduct
                            </Link>
                            <Link href="/CONTRIBUTING.md" className="text-white/90 hover:text-[#2AE6B2] hover:translate-x-1 transition-all text-sm">
                                Contributing
                            </Link>
                        </div>
                    </div>

                    {/* Social Section */}
                    <div className="space-y-4">
                        <h3 className="text-[#2AE6B2] text-lg font-bold">Connect With Us</h3>
                        <div className="flex gap-4">
                            <a
                                href="https://github.com/QuoteVote/quotevote-monorepo"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/10 rounded-full hover:bg-white/20 hover:text-[#2AE6B2] hover:scale-110 transition-all"
                                aria-label="Visit our GitHub repository"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                            <a
                                href="https://twitter.com/quotevote"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/10 rounded-full hover:bg-white/20 hover:text-[#2AE6B2] hover:scale-110 transition-all"
                                aria-label="Follow us on Twitter"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="https://linkedin.com/company/quotevote"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/10 rounded-full hover:bg-white/20 hover:text-[#2AE6B2] hover:scale-110 transition-all"
                                aria-label="Connect with us on LinkedIn"
                            >
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="border-t border-white/10 pt-8 text-center space-y-2">
                    <p className="text-sm">
                        Made with <span className="text-red-500 animate-pulse">❤️</span> on Earth
                    </p>
                    <p className="text-white/60 text-xs">
                        © {currentYear} Quote.Vote. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
