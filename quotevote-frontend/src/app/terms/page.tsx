import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Quote.Vote',
  description: 'Terms for accounts, content, discussion, moderation, and copyright on Quote.Vote.',
}

// Founder-approved legal copy: QuoteVote/quotevote-next#565.
// Replace every bracketed placeholder (e.g. [EFFECTIVE DATE], [DMCA AGENT NAME]) before merging or publishing this page.
export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <article className="space-y-5 text-base text-foreground">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{"Quote.Vote Terms of Service"}</h1>
        <p className="leading-7"><strong>{"Effective date:"}</strong>{" [EFFECTIVE DATE]"}</p>
        <p className="leading-7"><strong>{"Last updated:"}</strong>{" [EFFECTIVE DATE]"}</p>
        <p className="leading-7"><strong>{"Contact:"}</strong>{" "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"Welcome to Quote.Vote"}</h2>
        <p className="leading-7">{"Quote.Vote is a platform for thoughtful, text-based discussion. It allows people to share written material, select specific passages, express structured opinions, provide supporting information, and discuss ideas with others."}</p>
        <p className="leading-7">{"Our aim is to encourage reflection, constructive disagreement, and evidence-informed participation."}</p>
        <p className="leading-7">{"These Terms of Service (\"Terms\") explain the rights and responsibilities of people who access or use Quote.Vote."}</p>
        <p className="leading-7">{"By creating an account or using the service, you agree to these Terms. If you do not agree, you may not use the service."}</p>
        <p className="leading-7">{"Quote.Vote is operated by "}<strong>{"Quote Dot Vote, PBC"}</strong>{", a Delaware public benefit corporation (\"Quote.Vote,\" \"we,\" \"us,\" or \"our\"), [STREET ADDRESS]."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"1. Eligibility and Accounts"}</h2>
        <p className="leading-7">{"You must be at least 13 years old, or older where applicable law requires, to create an account. By creating an account, you confirm that you meet this requirement. If you are under 18, you must have the permission of a parent or legal guardian where required by law."}</p>
        <p className="leading-7">{"We do not knowingly allow children under 13 to create accounts. If we learn that an account belongs to a child under 13, we will close the account and delete the personal information associated with it."}</p>
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
        <li className="pl-1">{"Comply with applicable law, these Terms, and any community guidelines we publish on Quote.Vote."}</li>
        </ul>
        <p className="leading-7">{"Disagreement, criticism, satire, and controversial opinions do not, by themselves, constitute violations of these Terms."}</p>
        <p className="leading-7">{"Voting options such as Agree/Disagree, True/False, and Like/Dislike represent participant assessments. They do not establish that a statement is objectively accurate or endorsed by Quote.Vote."}</p>
        <p className="leading-7">{"Quote.Vote does not independently verify every claim, citation, or statement submitted by participants."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"3. Your Content and Ownership"}</h2>
        <p className="leading-7">{"You retain ownership of original content you create and publish on Quote.Vote."}</p>
        <p className="leading-7">{"You are responsible for ensuring that you have the rights or lawful permission needed to submit that content."}</p>
        <p className="leading-7">{"By publishing content, you grant Quote Dot Vote, PBC a worldwide, nonexclusive, royalty-free license to host, store, reproduce, display, adapt (for example, to excerpt, quote, reformat, translate, or make accessible), index, and distribute your content in connection with operating, securing, and improving the service. We may sublicense these rights only to our service providers and hosting partners, and to operators of Quote.Vote deployments that we host, solely so they can provide the service."}</p>
        <p className="leading-7">{"This permission includes enabling features through which other participants quote passages, respond to content, vote, and navigate discussions."}</p>
        <p className="leading-7">{"You also authorize other Quote.Vote participants to view your publicly available content and use the platform's built-in quotation and discussion features in relation to it."}</p>
        <p className="leading-7">{"These permissions do not transfer ownership of your original work to Quote.Vote. We will not sell your content to third parties for their independent use."}</p>
        <p className="leading-7">{"The license ends when you delete your content or close your account, except for: (a) copies held in backups for a limited period; (b) passages that other participants have already quoted in their own contributions in accordance with these Terms; and (c) copies we must keep to comply with law or resolve disputes. Removal requests and account deletion are addressed in Section 7."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"4. Quoting and Third-Party Material"}</h2>
        <p className="leading-7">{"Quote.Vote is designed to support discussion of existing written material, including material created by third parties."}</p>
        <p className="leading-7">{"Copyright law may permit some quotations for criticism, commentary, research, scholarship, news reporting, or other purposes under the doctrine of fair use. Whether a particular use qualifies depends on the circumstances."}</p>
        <p className="leading-7">{"You are responsible for evaluating whether you have the right to publish or quote material."}</p>
        <p className="leading-7">{"Do not post an entire copyrighted work that you do not own or have permission to post. Quote only the portions you need for commentary, criticism, or discussion, and identify the source."}</p>
        <p className="leading-7">{"You may not use Quote.Vote to distribute material that unlawfully infringes another person's intellectual property rights."}</p>
        <p className="leading-7">{"Where practical, participants are encouraged to identify the original source of quoted material so readers can examine it in context."}</p>
        <p className="leading-7">{"Quote.Vote may remove or restrict access to material in response to legally sufficient copyright complaints or other circumstances that warrant action under applicable law."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"5. Moderation and Community Standards"}</h2>
        <p className="leading-7">{"Quote.Vote is committed to supporting lawful discussion, including criticism and disagreement."}</p>
        <p className="leading-7">{"We are not obligated to monitor content. We may review, remove, or restrict content or accounts at our discretion, including content we consider harassing, unlawful, or otherwise in violation of these Terms."}</p>
        <p className="leading-7">{"We may investigate reports of conduct or content that appears to violate these Terms, any community guidelines we publish, or applicable law."}</p>
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
        <p className="leading-7">{"Concerns about moderation, and reports of content you believe is illegal, may be submitted to "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a>{"."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"6. Copyright Complaints and DMCA Policy"}</h2>
        <p className="leading-7">{"Quote.Vote respects copyright holders and seeks to comply with applicable copyright law, including the Digital Millennium Copyright Act (DMCA)."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Designated copyright agent"}</h3>
        <p className="leading-7">{"Copyright notices and counter-notifications must be sent to our designated agent:"}</p>
        <p className="leading-7">{"[DMCA AGENT NAME OR TITLE], Quote Dot Vote, PBC (also operating as Quote.Vote), [STREET ADDRESS], [PHONE NUMBER], "}<a href="mailto:[DMCA EMAIL]" className="underline underline-offset-2">{"[DMCA EMAIL]"}</a></p>
        <p className="leading-7">{"Notices sent to any other address may not be processed."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Reporting alleged infringement"}</h3>
        <p className="leading-7">{"If you believe that material available through Quote.Vote infringes a copyright you own or are authorized to enforce, you may send a written notification containing:"}</p>
        <ol className="ml-6 list-decimal space-y-2">
        <li className="pl-1">{"Your physical or electronic signature."}</li>
        <li className="pl-1">{"Identification of the copyrighted work claimed to have been infringed, or a representative list where applicable."}</li>
        <li className="pl-1">{"Identification of the allegedly infringing material and sufficient information, such as a URL, to locate it."}</li>
        <li className="pl-1">{"Your name, mailing address, telephone number, and email address."}</li>
        <li className="pl-1">{"A statement that you have a good-faith belief that the disputed use is unauthorized by the copyright owner, their agent, or the law."}</li>
        <li className="pl-1">{"A statement that the information in your notice is accurate and, under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed."}</li>
        </ol>
        <p className="leading-7">{"Before submitting a notice, please consider whether the use may be a fair use. We may be unable to act on notices that do not include all of the information above. We may send a copy of your notice, including your contact information, to the participant who posted the material."}</p>
        <p className="leading-7">{"We will review copyright notices and take appropriate action under applicable law, which may include expeditiously removing or disabling access to material. When we do, we will take reasonable steps to promptly notify the participant who posted it and explain how to submit a counter-notification."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Counter-notifications"}</h3>
        <p className="leading-7">{"If material you submitted was removed or disabled because of a copyright complaint and you believe this occurred through mistake or misidentification, you may submit a counter-notification to our designated agent listed above."}</p>
        <p className="leading-7">{"A legally sufficient DMCA counter-notification must include:"}</p>
        <ol className="ml-6 list-decimal space-y-2">
        <li className="pl-1">{"Your physical or electronic signature."}</li>
        <li className="pl-1">{"Identification of the removed material and its former location."}</li>
        <li className="pl-1">{"A statement under penalty of perjury that you have a good-faith belief that the material was removed or disabled because of mistake or misidentification."}</li>
        <li className="pl-1">{"Your name, address, and telephone number."}</li>
        <li className="pl-1">{"The required statement consenting to jurisdiction of the appropriate United States federal district court and accepting service of process from the complainant or their agent."}</li>
        </ol>
        <p className="leading-7">{"If we receive a valid counter-notification, we will promptly send a copy to the person who submitted the original notice and tell them that we will restore the material in 10 business days. We will restore the material no less than 10 and no more than 14 business days after we receive the counter-notification, unless our designated agent first receives notice that the complaining party has filed a court action seeking to restrain the allegedly infringing activity."}</p>
        <p className="leading-7">{"Under 17 U.S.C. § 512(f), any person who knowingly and materially misrepresents that material is infringing, or that material was removed by mistake or misidentification, may be liable for damages, including costs and attorneys' fees."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Repeat-infringer policy"}</h3>
        <p className="leading-7">{"Quote.Vote terminates, in appropriate circumstances, the accounts of participants who are repeat infringers."}</p>
        <p className="leading-7">{"We record each valid copyright notice against the account that posted the material. An account that receives three valid notices that are not successfully countered or withdrawn, or that a court finds to have infringed copyright, will be terminated. We may terminate an account sooner for willful or flagrant infringement."}</p>
        <p className="leading-7">{"A complaint does not automatically constitute a final determination of infringement. In applying this policy, we consider counter-notifications, withdrawn or mistaken notices, and applicable legal determinations."}</p>
        <p className="leading-7">{"We will also accommodate and avoid interfering with standard technical measures to identify or protect copyrighted works where required by law."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"7. Account Closure and Data Requests"}</h2>
        <p className="leading-7">{"You may request account closure or ask about access to, correction of, or deletion of personal information by emailing "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a>{"."}</p>
        <p className="leading-7">{"We may take reasonable steps to verify your identity before acting on a request."}</p>
        <p className="leading-7">{"We will acknowledge your request within 7 days and aim to complete it within 30 days. If we need more time, we will tell you why and when we expect to finish."}</p>
        <p className="leading-7">{"Some information may need to be retained for legitimate and lawful purposes, including security, dispute resolution, legal compliance, and record integrity."}</p>
        <p className="leading-7">{"Because Quote.Vote supports shared discussions, removing an account or an original contribution may affect related conversations. Other participants' independently authored replies or contributions may remain where lawful and appropriate."}</p>
        <p className="leading-7">{"Material copied or shared outside Quote.Vote may also remain beyond our control."}</p>
        <p className="leading-7">{"We will explain relevant limitations when responding to a request rather than promising deletion from systems or third-party locations we do not control."}</p>
        <p className="leading-7">{"Our "}<a href="/privacy" className="underline underline-offset-2">{"Privacy Notice"}</a>{" explains how we collect, use, share, and retain personal information, and the privacy choices available to you."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"8. Service Availability and Changes"}</h2>
        <p className="leading-7">{"Quote.Vote is an evolving open-source project. Features may be incomplete, modified, temporarily unavailable, or discontinued."}</p>
        <p className="leading-7">{"We may make changes to the service to improve its operation, address technical limitations, respond to legal requirements, or protect participants and infrastructure."}</p>
        <p className="leading-7">{"We do not guarantee uninterrupted availability, indefinite preservation of every contribution, or compatibility with all third-party systems."}</p>
        <p className="leading-7">{"Where reasonably practicable, we will communicate significant changes that materially affect participants."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"9. Open-Source Software and Intellectual Property"}</h2>
        <p className="leading-7">{"The software underlying Quote.Vote is developed as an open-source project. The source code is available at "}<a href="https://github.com/QuoteVote" className="underline underline-offset-2">{"github.com/QuoteVote"}</a>{" and is distributed under the open-source license stated in each repository, including the GNU Lesser General Public License v3 (LGPL v3)."}</p>
        <p className="leading-7">{"Those software licenses govern rights to use, copy, modify, and distribute the covered code."}</p>
        <p className="leading-7">{"Open-source software licenses apply only to the software source code. They do not apply to content posted by participants, which is governed by Section 3. Using, copying, or forking the software does not give anyone rights to the content or data hosted on Quote.Vote."}</p>
        <p className="leading-7">{"These Terms govern use of the hosted Quote.Vote service. They do not override rights granted under applicable open-source software licenses."}</p>
        <p className="leading-7">{"Quote.Vote's name, branding, trademarks, and other materials remain subject to their respective intellectual property rights. Forks and independent deployments of the software may not use the Quote.Vote name or logos in a way that suggests they are operated or endorsed by Quote.Vote without our permission."}</p>
        <p className="leading-7">{"Contributing code to the open-source project may be governed by separate contribution and licensing rules."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"10. External Links and Third-Party Services"}</h2>
        <p className="leading-7">{"Participants may share links to external sources or services."}</p>
        <p className="leading-7">{"Quote.Vote does not control third-party websites and does not guarantee their accuracy, security, accessibility, or availability."}</p>
        <p className="leading-7">{"Third-party services may be subject to their own terms and privacy practices."}</p>
        <p className="leading-7">{"A link or citation does not necessarily indicate endorsement by Quote.Vote."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"11. Disclaimers"}</h2>
        <p className="leading-7">{"QUOTE.VOTE IS PROVIDED ON AN \"AS IS\" AND \"AS AVAILABLE\" BASIS TO THE EXTENT PERMITTED BY LAW."}</p>
        <p className="leading-7">{"We make no guarantees that the service will always be available, secure, error-free, or suitable for a particular purpose."}</p>
        <p className="leading-7">{"Statements, voting results, commentary, and evidence shared by participants are provided for discussion and should be evaluated independently."}</p>
        <p className="leading-7">{"TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM IMPLIED WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT."}</p>
        <p className="leading-7">{"Nothing in these Terms excludes rights or responsibilities that cannot lawfully be excluded."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"12. Limitation of Liability"}</h2>
        <p className="leading-7">{"TO THE EXTENT PERMITTED BY APPLICABLE LAW, QUOTE.VOTE AND ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, CONTRIBUTORS, VOLUNTEERS, AND MODERATORS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM USE OF THE SERVICE."}</p>
        <p className="leading-7">{"TO THE EXTENT PERMITTED BY APPLICABLE LAW, OUR AGGREGATE LIABILITY ARISING FROM OR RELATING TO THE FREE HOSTED SERVICE WILL NOT EXCEED THE GREATER OF $100 OR THE AMOUNT YOU PAID US FOR THAT SERVICE DURING THE TWELVE MONTHS PRECEDING THE CLAIM."}</p>
        <p className="leading-7">{"Nothing in these Terms limits liability for fraud, gross negligence, or willful misconduct, or any other liability that cannot be limited under applicable law."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"13. Your Responsibility for Claims About Your Content"}</h2>
        <p className="leading-7">{"To the extent permitted by applicable law, you will indemnify Quote Dot Vote, PBC against third-party claims, and the reasonable costs of defending them, to the extent the claims arise from content you post in violation of these Terms or applicable law, or from your violation of these Terms. We will notify you promptly of any such claim and allow you to participate in its defense."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"14. Paid Services"}</h2>
        <p className="leading-7">{"Any paid services, hosted deployments for organizations, or other commercial offerings will be governed by a separate written agreement. If that agreement conflicts with these Terms, the separate agreement controls for those services."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"15. Termination"}</h2>
        <p className="leading-7">{"You may stop using Quote.Vote at any time and request account closure."}</p>
        <p className="leading-7">{"We may suspend or terminate access when reasonably necessary to enforce these Terms, protect users or infrastructure, address repeated violations, or comply with legal obligations."}</p>
        <p className="leading-7">{"The following sections survive termination: Section 3 (to the extent described there), Section 4, Section 6, Sections 9 through 13, Section 15, and Section 17."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"16. Changes to These Terms"}</h2>
        <p className="leading-7">{"We may update these Terms to reflect changes in the service, applicable law, or our operational practices."}</p>
        <p className="leading-7">{"The current version and its effective date will be available on Quote.Vote, and we will keep prior versions available for reference."}</p>
        <p className="leading-7">{"We will give at least 30 days' notice of material changes by email to the address on your account and by a notice on Quote.Vote. For material changes, we will ask you to accept the updated Terms when you next sign in. If you do not accept them, you may close your account under Section 7, and the previous Terms will continue to apply to you until your account is closed."}</p>
        <p className="leading-7">{"Changes to these Terms do not apply to disputes that arose before the change took effect."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"17. Governing Law, Disputes, and General Provisions"}</h2>
        <p className="leading-7">{"These Terms are governed by the laws of the State of Delaware, United States, without regard to its conflict-of-laws rules, except where applicable law requires otherwise."}</p>
        <p className="leading-7">{"Before filing a claim, you and we agree to try to resolve the dispute informally by sending a written description of it to the other party and allowing 30 days to resolve it."}</p>
        <p className="leading-7">{"Any dispute arising from these Terms or the service will be resolved in the state or federal courts located in Delaware, and you and we consent to the jurisdiction of those courts. Either party may instead bring an individual claim in small claims court where it qualifies. Nothing in this section limits rights you may have under the consumer laws of the place where you live."}</p>
        <p className="leading-7">{"If any provision is found unenforceable, the remaining provisions will continue in effect to the extent permitted by law."}</p>
        <p className="leading-7">{"Our failure to enforce a particular provision does not waive our ability to enforce it later."}</p>
        <p className="leading-7">{"You may not assign or transfer these Terms without our consent. We may assign these Terms in connection with a merger, acquisition, reorganization, or sale of assets, or to an affiliate, with notice to you."}</p>
        <p className="leading-7">{"We may give you notices by email to the address on your account or by posting them on Quote.Vote. You may give us notices by email to "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a>{", except that copyright notices must be sent to our designated agent under Section 6."}</p>
        <p className="leading-7">{"These Terms, together with our Privacy Notice and any applicable separate agreements, are the entire agreement between you and Quote.Vote concerning the hosted service."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"18. Contact"}</h2>
        <p className="leading-7">{"For questions about these Terms, account requests, privacy concerns, or reports of legal violations, please contact us. Copyright notices should be sent to our designated agent listed in Section 6."}</p>
        <p className="leading-7"><strong>{"Quote.Vote"}</strong></p>
        <p className="leading-7">{"Operated by Quote Dot Vote, PBC, [STREET ADDRESS]"}</p>
        <p className="leading-7">{"Email: "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></p>
        <p className="leading-7">{"Website: "}<a href="https://quote.vote" className="underline underline-offset-2">{"https://quote.vote"}</a></p>
        <p className="leading-7">{"We welcome good-faith questions and feedback about our policies and how they affect participation."}</p>
        <p className="leading-7"><strong>{"Our objective is to sustain a space where people can examine ideas, disagree constructively, and participate with clear rights and responsibilities."}</strong></p>
      </article>
    </main>
  )
}
