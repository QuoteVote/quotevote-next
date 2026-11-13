import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Quote.Vote',
  description: 'Terms for accounts, content, discussion, moderation, and copyright on Quote.Vote.',
}

// Founder-approved legal copy: QuoteVote/quotevote-next#565.
// Set the actual effective date before merging or publishing this page.
export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <article className="space-y-5 text-base text-foreground">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{"Quote.Vote Terms of Service"}</h1>
        <p className="leading-7"><strong>{"Effective date:"}</strong>{" To be established upon publication "}<strong>{"Contact:"}</strong>{" "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"Welcome to Quote.Vote"}</h2>
        <p className="leading-7">{"Quote.Vote is a platform for thoughtful, text-based discussion. It allows people to share written material, select specific passages, express structured opinions, provide supporting information, and discuss ideas with others."}</p>
        <p className="leading-7">{"Our aim is to encourage reflection, constructive disagreement, and evidence-informed participation."}</p>
        <p className="leading-7">{"These Terms of Service (\"Terms\") explain the rights and responsibilities of people who access or use Quote.Vote."}</p>
        <p className="leading-7">{"By creating an account or using the service, you agree to these Terms. If you do not agree, you may not use the service."}</p>
        <p className="leading-7">{"Quote.Vote is operated by "}<strong>{"Quote Dot Vote, PBC"}</strong>{", a Delaware public benefit corporation (\"Quote.Vote,\" \"we,\" \"us,\" or \"our\")."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"1. Eligibility and Accounts"}</h2>
        <p className="leading-7">{"You must be at least 13 years old, or older where applicable law requires, to create an account. If you are under 18, you must have the permission of a parent or legal guardian where required by law."}</p>
        <p className="leading-7">{"You agree to provide accurate registration information and keep your login credentials secure. You are responsible for activities conducted through your account, except where applicable law provides otherwise."}</p>
        <p className="leading-7">{"Account registration may be limited to invited participants while Quote.Vote is under development. We may restrict, suspend, or close accounts when necessary to protect the service, enforce these Terms, or comply with applicable law."}</p>
        <p className="leading-7">{"You may contact "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a>{" for help with your account."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"2. Participating in Discussions"}</h2>
        <p className="leading-7">{"Quote.Vote supports written posts, passage-level quotations, structured voting, comments, discussions, and related participation features."}</p>
        <p className="leading-7">{"You are welcome to express opinions, challenge claims, ask questions, and disagree with other participants."}</p>
        <p className="leading-7">{"You agree to:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"Engage with other participants without harassment, threats, or intimidation."}</li>
        <li className="pl-1">{"Respect other people's privacy and intellectual property."}</li>
        <li className="pl-1">{"Avoid impersonation, fraud, spam, and deliberate manipulation of platform features."}</li>
        <li className="pl-1">{"Comply with applicable law and our published Code of Conduct."}</li>
        </ul>
        <p className="leading-7">{"Disagreement, criticism, satire, and controversial opinions do not, by themselves, constitute violations of these Terms."}</p>
        <p className="leading-7">{"Voting options such as Agree/Disagree, True/False, and Like/Dislike represent participant assessments. They do not establish that a statement is objectively accurate or endorsed by Quote.Vote."}</p>
        <p className="leading-7">{"Quote.Vote does not independently verify every claim, citation, or statement submitted by participants."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"3. Your Content and Ownership"}</h2>
        <p className="leading-7">{"You retain ownership of original content you create and publish on Quote.Vote."}</p>
        <p className="leading-7">{"You are responsible for ensuring that you have the rights or lawful permission needed to submit that content."}</p>
        <p className="leading-7">{"By publishing content, you grant Quote.Vote a nonexclusive, worldwide, royalty-free license to host, store, reproduce, display, format, index, and distribute it as reasonably necessary to operate and maintain the service."}</p>
        <p className="leading-7">{"This permission includes enabling features through which other participants quote passages, respond to content, vote, and navigate discussions."}</p>
        <p className="leading-7">{"You also authorize other Quote.Vote participants to view your publicly available content and use the platform's built-in quotation and discussion features in relation to it."}</p>
        <p className="leading-7">{"These permissions do not transfer ownership of your original work to Quote.Vote or authorize unrelated commercial exploitation of your content."}</p>
        <p className="leading-7">{"The license continues for as long as reasonably necessary to provide the service and handle lawful retention requirements. Removal requests and account deletion are addressed in Section 7."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"4. Quoting and Third-Party Material"}</h2>
        <p className="leading-7">{"Quote.Vote is designed to support discussion of existing written material, including material created by third parties."}</p>
        <p className="leading-7">{"Copyright law may permit some quotations for criticism, commentary, research, scholarship, news reporting, or other purposes under the doctrine of fair use. Whether a particular use qualifies depends on the circumstances."}</p>
        <p className="leading-7">{"You are responsible for evaluating whether you have the right to publish or quote material."}</p>
        <p className="leading-7">{"You may not use Quote.Vote to distribute material that unlawfully infringes another person's intellectual property rights."}</p>
        <p className="leading-7">{"Where practical, participants are encouraged to identify the original source of quoted material so readers can examine it in context."}</p>
        <p className="leading-7">{"Quote.Vote may remove or restrict access to material in response to legally sufficient copyright complaints or other circumstances that warrant action under applicable law."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"5. Moderation and Community Standards"}</h2>
        <p className="leading-7">{"Quote.Vote is committed to supporting lawful discussion, including criticism and disagreement."}</p>
        <p className="leading-7">{"We may investigate reports of conduct or content that appears to violate these Terms, our Code of Conduct, or applicable law."}</p>
        <p className="leading-7">{"Depending on the circumstances, our responses may include:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"Requesting clarification or correction."}</li>
        <li className="pl-1">{"Issuing a warning."}</li>
        <li className="pl-1">{"Temporarily restricting content or features."}</li>
        <li className="pl-1">{"Removing or disabling access to content."}</li>
        <li className="pl-1">{"Suspending or terminating an account."}</li>
        </ul>
        <p className="leading-7">{"We aim to apply our rules consistently and consider context, proportionality, and opportunities for correction."}</p>
        <p className="leading-7">{"Where practicable and appropriate, affected participants may receive an explanation and an opportunity to request reconsideration. Certain legal, security, or safety circumstances may limit the information we can disclose."}</p>
        <p className="leading-7">{"Moderation decisions do not imply that Quote.Vote endorses or rejects a participant's political, philosophical, or other lawful viewpoint."}</p>
        <p className="leading-7">{"Concerns about moderation may be submitted to "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a>{"."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"6. Copyright Complaints and DMCA Policy"}</h2>
        <p className="leading-7">{"Quote.Vote respects copyright holders and seeks to comply with applicable copyright law, including the Digital Millennium Copyright Act (DMCA)."}</p>
        <p className="leading-7"><strong>{"Copyright contact:"}</strong>{" "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></p>
        <h3 className="pt-3 text-lg font-semibold">{"Reporting alleged infringement"}</h3>
        <p className="leading-7">{"If you believe that material available through Quote.Vote infringes a copyright you own or are authorized to enforce, you may send a written notification containing:"}</p>
        <ol className="ml-6 list-decimal space-y-2">
        <li className="pl-1">{"Your physical or electronic signature."}</li>
        <li className="pl-1">{"Identification of the copyrighted work claimed to have been infringed, or a representative list where applicable."}</li>
        <li className="pl-1">{"Identification of the allegedly infringing material and sufficient information, such as a URL, to locate it."}</li>
        <li className="pl-1">{"Your name and reasonably sufficient contact information, including an email address."}</li>
        <li className="pl-1">{"A statement that you have a good-faith belief that the disputed use is unauthorized by the copyright owner, their agent, or the law."}</li>
        <li className="pl-1">{"A statement, under penalty of perjury, that the information in your notice is accurate and that you are authorized to act on behalf of the owner of the allegedly infringed right."}</li>
        </ol>
        <p className="leading-7">{"We will review copyright notices and take appropriate action under applicable law, which may include expeditiously removing or disabling access to material."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Counter-notifications"}</h3>
        <p className="leading-7">{"If material you submitted was removed or disabled because of a copyright complaint and you believe this occurred through mistake or misidentification, you may submit a counter-notification to "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a>{"."}</p>
        <p className="leading-7">{"A legally sufficient DMCA counter-notification must include:"}</p>
        <ol className="ml-6 list-decimal space-y-2">
        <li className="pl-1">{"Your physical or electronic signature."}</li>
        <li className="pl-1">{"Identification of the removed material and its former location."}</li>
        <li className="pl-1">{"A statement under penalty of perjury that you have a good-faith belief that the material was removed or disabled because of mistake or misidentification."}</li>
        <li className="pl-1">{"Your name, address, and telephone number."}</li>
        <li className="pl-1">{"The required statement consenting to jurisdiction of the appropriate United States federal district court and accepting service of process from the complainant or their agent."}</li>
        </ol>
        <p className="leading-7">{"We will follow applicable statutory procedures concerning delivery of counter-notifications to claimants and restoration of material."}</p>
        <p className="leading-7">{"Submitting knowingly false or materially misleading copyright notices or counter-notifications can have legal consequences."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Repeat-infringer policy"}</h3>
        <p className="leading-7">{"Quote.Vote maintains a policy of terminating accounts of repeat copyright infringers in appropriate circumstances."}</p>
        <p className="leading-7">{"We may consider documented infringement, the reliability and disposition of copyright complaints, counter-notifications, applicable legal determinations, and other relevant circumstances."}</p>
        <p className="leading-7">{"A complaint does not automatically constitute a final determination of infringement."}</p>
        <p className="leading-7">{"We may restrict or terminate accounts when repeated infringement is established or when otherwise appropriate under applicable law."}</p>
        <p className="leading-7">{"We will also accommodate and avoid interfering with standard technical measures to identify or protect copyrighted works where required by law."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"7. Account Closure and Data Requests"}</h2>
        <p className="leading-7">{"You may request account closure or ask about access to, correction of, or deletion of personal information by emailing "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a>{"."}</p>
        <p className="leading-7">{"We may take reasonable steps to verify your identity before acting on a request."}</p>
        <p className="leading-7">{"We will respond according to applicable law and our operational capabilities."}</p>
        <p className="leading-7">{"Some information may need to be retained for legitimate and lawful purposes, including security, dispute resolution, legal compliance, and record integrity."}</p>
        <p className="leading-7">{"Because Quote.Vote supports shared discussions, removing an account or an original contribution may affect related conversations. Other participants' independently authored replies or contributions may remain where lawful and appropriate."}</p>
        <p className="leading-7">{"Material copied or shared outside Quote.Vote may also remain beyond our control."}</p>
        <p className="leading-7">{"We will explain relevant limitations when responding to a request rather than promising deletion from systems or third-party locations we do not control."}</p>
        <p className="leading-7"><strong><a href="/privacy" className="underline underline-offset-2">{"Privacy Notice:"}</a></strong>{" A separate Privacy Notice will describe our actual data collection, use, storage, disclosure, retention, and applicable privacy rights. That notice must be made available before these Terms are published."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"8. Service Availability and Changes"}</h2>
        <p className="leading-7">{"Quote.Vote is an evolving open-source project. Features may be incomplete, modified, temporarily unavailable, or discontinued."}</p>
        <p className="leading-7">{"We may make changes to the service to improve its operation, address technical limitations, respond to legal requirements, or protect participants and infrastructure."}</p>
        <p className="leading-7">{"We do not guarantee uninterrupted availability, indefinite preservation of every contribution, or compatibility with all third-party systems."}</p>
        <p className="leading-7">{"Where reasonably practicable, we will communicate significant changes that materially affect participants."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"9. Open-Source Software and Intellectual Property"}</h2>
        <p className="leading-7">{"The software underlying Quote.Vote is developed as an open-source project and is distributed under applicable open-source licenses, including GNU LGPL v3 where specified."}</p>
        <p className="leading-7">{"Those software licenses govern rights to use, copy, modify, and distribute the covered code."}</p>
        <p className="leading-7">{"These Terms govern use of the hosted Quote.Vote service. They do not override rights granted under applicable open-source software licenses."}</p>
        <p className="leading-7">{"Quote.Vote's name, branding, trademarks, and other materials remain subject to their respective intellectual property rights."}</p>
        <p className="leading-7">{"Contributing code to the open-source project may be governed by separate contribution and licensing rules."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"10. External Links and Third-Party Services"}</h2>
        <p className="leading-7">{"Participants may share links to external sources or services."}</p>
        <p className="leading-7">{"Quote.Vote does not control third-party websites and does not guarantee their accuracy, security, accessibility, or availability."}</p>
        <p className="leading-7">{"Third-party services may be subject to their own terms and privacy practices."}</p>
        <p className="leading-7">{"A link or citation does not necessarily indicate endorsement by Quote.Vote."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"11. Disclaimers"}</h2>
        <p className="leading-7">{"Quote.Vote is provided on an \"as is\" and \"as available\" basis to the extent permitted by law."}</p>
        <p className="leading-7">{"We make no guarantees that the service will always be available, secure, error-free, or suitable for a particular purpose."}</p>
        <p className="leading-7">{"Statements, voting results, commentary, and evidence shared by participants are provided for discussion and should be evaluated independently."}</p>
        <p className="leading-7">{"To the maximum extent permitted by law, we disclaim implied warranties, including merchantability, fitness for a particular purpose, and noninfringement."}</p>
        <p className="leading-7">{"Nothing in these Terms excludes rights or responsibilities that cannot lawfully be excluded."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"12. Limitation of Liability"}</h2>
        <p className="leading-7">{"To the extent permitted by applicable law, Quote.Vote and its directors, officers, employees, and agents will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages arising from use of the service."}</p>
        <p className="leading-7">{"To the extent permitted by applicable law, our aggregate liability arising from or relating to the free hosted service will not exceed the greater of $100 or the amount you paid us for that service during the twelve months preceding the claim."}</p>
        <p className="leading-7">{"These limitations do not apply where prohibited by law and do not exclude liability that cannot legally be limited."}</p>
        <p className="leading-7">{"Any future paid services or organizational deployments may be governed by additional or separate written agreements."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"13. Termination"}</h2>
        <p className="leading-7">{"You may stop using Quote.Vote at any time and request account closure."}</p>
        <p className="leading-7">{"We may suspend or terminate access when reasonably necessary to enforce these Terms, protect users or infrastructure, address repeated violations, or comply with legal obligations."}</p>
        <p className="leading-7">{"Termination does not automatically eliminate rights, obligations, or records that must reasonably survive termination, including lawful retention, intellectual property, dispute resolution, and applicable liability provisions."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"14. Changes to These Terms"}</h2>
        <p className="leading-7">{"We may update these Terms to reflect changes in the service, applicable law, or our operational practices."}</p>
        <p className="leading-7">{"The current version and its effective date will be made available on Quote.Vote."}</p>
        <p className="leading-7">{"For material changes, we will provide reasonable notice where appropriate and legally required."}</p>
        <p className="leading-7">{"Continued use after revised Terms become effective constitutes acceptance to the extent permitted by law. Where additional consent is legally required, we will seek it."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"15. Governing Law and General Provisions"}</h2>
        <p className="leading-7">{"These Terms are governed by the laws of the State of Delaware, United States, except where applicable law requires otherwise."}</p>
        <p className="leading-7">{"If any provision is found unenforceable, the remaining provisions will continue in effect to the extent permitted by law."}</p>
        <p className="leading-7">{"Our failure to enforce a particular provision does not waive our ability to enforce it later."}</p>
        <p className="leading-7">{"These Terms, together with any expressly incorporated policies or applicable separate agreements, govern the relationship between you and Quote.Vote concerning the hosted service."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"16. Contact"}</h2>
        <p className="leading-7">{"For questions about these Terms, account requests, privacy concerns, copyright complaints, or reports of legal violations, please contact:"}</p>
        <p className="leading-7"><strong>{"Quote.Vote"}</strong>{" Operated by Quote Dot Vote, PBC Email: "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a>{" Website: "}<a href="https://quote.vote" className="underline underline-offset-2">{"https://quote.vote"}</a></p>
        <p className="leading-7">{"We welcome good-faith questions and feedback about our policies and how they affect participation."}</p>
        <p className="leading-7"><strong>{"Our objective is to sustain a space where people can examine ideas, disagree constructively, and participate with clear rights and responsibilities."}</strong></p>
      </article>
    </main>
  )
}
