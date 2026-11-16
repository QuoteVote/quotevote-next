import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Notice - Quote.Vote',
  description: 'Learn how Quote.Vote collects, uses, shares, stores, and responds to requests about personal information.',
}

// Founder-approved privacy copy (2026-10-09), tracked in issue #566; counsel redline applied.
// Before release, set the actual effective date, fill bracketed retention periods, and verify operational claims.
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <article className="space-y-5 text-base text-foreground">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{"Quote.Vote Privacy Notice"}</h1>
        <p className="leading-7"><strong>{"Effective date:"}</strong>{" [EFFECTIVE DATE]"}</p>
        <p className="leading-7"><strong>{"Privacy contact:"}</strong>{" "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"Our Commitment to Privacy"}</h2>
        <p className="leading-7">{"Quote.Vote is an open-source platform designed to encourage thoughtful, evidence-informed discussion."}</p>
        <p className="leading-7">{"We believe people should understand what information a platform collects, how it is used, who can access it, and what choices are available to them."}</p>
        <p className="leading-7">{"This Privacy Notice explains how personal information is handled when you visit Quote.Vote, create an account, participate in discussions, communicate with other members, or contact us."}</p>
        <p className="leading-7">{"Quote.Vote is operated by "}<strong>{"Quote Dot Vote, PBC"}</strong>{", a Delaware public benefit corporation (\"Quote.Vote,\" \"we,\" \"us,\" or \"our\")."}</p>
        <p className="leading-7">{"This Notice applies to the Quote.Vote service that we host and operate at quote.vote. It does not apply to copies of the open-source Quote.Vote software that other people or organizations run themselves; those operators are responsible for their own privacy practices. See Section 17."}</p>
        <p className="leading-7">{"Questions or requests concerning privacy may be directed to "}<strong><a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></strong>{"."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"1. Information We Collect"}</h2>
        <p className="leading-7">{"We collect and process information necessary to provide, maintain, secure, and improve Quote.Vote."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Account and profile information"}</h3>
        <p className="leading-7">{"When you register or manage an account, we may collect:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"Email address and username."}</li>
        <li className="pl-1">{"Name, biography, avatar, location, website, organization name, and other profile information you choose to provide."}</li>
        <li className="pl-1">{"Password credentials and authentication information."}</li>
        <li className="pl-1">{"Account preferences and settings."}</li>
        <li className="pl-1">{"Invitation requests, invitation status, and registration information."}</li>
        <li className="pl-1">{"A record of the version of our Terms of Service you accepted and when you accepted it."}</li>
        <li className="pl-1">{"Communications you send to Quote.Vote, including messages sent through contact or access-request forms by people who do not have an account."}</li>
        </ul>
        <p className="leading-7">{"Passwords are stored in hashed form."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Participation and discussion information"}</h3>
        <p className="leading-7">{"When you use Quote.Vote, we may collect and store:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"Posts and other written contributions."}</li>
        <li className="pl-1">{"Selected passages and quotations."}</li>
        <li className="pl-1">{"Votes, reactions, comments, and discussion activity."}</li>
        <li className="pl-1">{"Messages and conversation participation."}</li>
        <li className="pl-1">{"Follow relationships, connections, and blocked accounts."}</li>
        <li className="pl-1">{"Notifications and activity history."}</li>
        <li className="pl-1">{"Reports concerning accounts or content, including reports that an account may be automated."}</li>
        </ul>
        <p className="leading-7">{"Certain communication features also process online presence, typing indicators, message delivery status, and read receipts."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Account standing information"}</h3>
        <p className="leading-7">{"We calculate and store indicators about each account, such as participation, conduct, and invitation-network scores, and the number of reports other participants have made about the account. We use these indicators to help manage invitations, limit abuse, and identify automated accounts."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Payment information"}</h3>
        <p className="leading-7">{"If you purchase a plan or make a payment, the payment is processed by Stripe. We receive and store your plan and a Stripe customer identifier. We do not receive or store your full payment card number."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Solid Pod information"}</h3>
        <p className="leading-7">{"If you choose to connect a Solid Pod, we store the address of your Pod and the access credentials needed to read from and write to it, in encrypted form. We use them only to copy the profile, preference, and activity information you choose to sync between Quote.Vote and your Pod. You can disconnect your Pod at any time."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Technical and operational information"}</h3>
        <p className="leading-7">{"When you access the service, Quote.Vote and its infrastructure providers may process:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"IP addresses and basic browser or device information. We store IP addresses temporarily to limit repeated requests, such as invitation and password-reset requests, and to protect the service from abuse."}</li>
        <li className="pl-1">{"Authentication tokens and session information."}</li>
        <li className="pl-1">{"Request times, application errors, and operational logs. Logs may include email addresses to which we send account messages."}</li>
        <li className="pl-1">{"Security-related events and diagnostic information."}</li>
        <li className="pl-1">{"Browser storage used for account access and interface preferences."}</li>
        </ul>
        <p className="leading-7">{"We seek to limit collection and use to legitimate purposes connected with operating the service."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"2. How We Use Information"}</h2>
        <p className="leading-7">{"We use information to:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"Register, authenticate, and maintain accounts."}</li>
        <li className="pl-1">{"Display profiles and enable user participation."}</li>
        <li className="pl-1">{"Process quotations, votes, comments, messages, and other interactions."}</li>
        <li className="pl-1">{"Manage invitations, notifications, and account communications."}</li>
        <li className="pl-1">{"Support real-time discussion features."}</li>
        <li className="pl-1">{"Process payments and manage plans."}</li>
        <li className="pl-1">{"Sync information with a Solid Pod when you ask us to."}</li>
        <li className="pl-1">{"Respond to requests, complaints, and reports."}</li>
        <li className="pl-1">{"Investigate potential violations of our "}<a href="/terms" className="underline underline-offset-2">{"Terms of Service"}</a>{" and any community guidelines we publish."}</li>
        <li className="pl-1">{"Calculate account standing indicators and detect abuse and automated accounts."}</li>
        <li className="pl-1">{"Protect accounts, participants, and infrastructure."}</li>
        <li className="pl-1">{"Diagnose technical problems and improve service reliability and accessibility."}</li>
        <li className="pl-1">{"Comply with applicable laws and lawful legal processes."}</li>
        </ul>
        <p className="leading-7">{"We may evaluate aggregate patterns of service usage and technical performance to understand how well the platform operates. Such processing may involve personal information where necessary."}</p>
        <p className="leading-7">{"We do not sell personal information and do not use participant information to deliver behaviorally targeted advertising."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"3. Public Information and Discussions"}</h2>
        <p className="leading-7">{"Quote.Vote is designed to facilitate public discourse."}</p>
        <p className="leading-7">{"Information you choose to publish through public-facing features—including profiles, posts, quotations, votes, and comments—may be visible to other participants and, where the feature permits, visitors without accounts."}</p>
        <p className="leading-7">{"Discussion rooms attached to public posts are open to all participants and are not private."}</p>
        <p className="leading-7">{"Other participants may respond to, quote, link to, or reference your public contributions."}</p>
        <p className="leading-7">{"Public information may also be copied or preserved by other people outside Quote.Vote."}</p>
        <p className="leading-7">{"Your votes and the positions you take in discussions may reveal your political, social, or other views. You should consider these possibilities before posting personal or sensitive information in public discussions."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"4. Direct Messages and Private Communications"}</h2>
        <p className="leading-7">{"Direct messages are shown in the service only to the participants in a conversation."}</p>
        <p className="leading-7">{"Direct messages are not end-to-end encrypted. They are stored on our servers in a form that Quote.Vote personnel and service providers with access to our database could read. We limit that access to people who need it and who are bound by confidentiality obligations, and we access message content only to respond to reports, investigate abuse, resolve technical problems, or comply with legal requirements."}</p>
        <p className="leading-7">{"Direct messages are not treated as publicly published contributions merely because they are stored on Quote.Vote."}</p>
        <p className="leading-7">{"However, participants in a conversation may independently copy, record, or share messages they receive. Quote.Vote cannot control every subsequent use of information disclosed by another participant."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"5. Moderation Reports"}</h2>
        <p className="leading-7">{"Reports about users, content, or potential violations of our community standards are intended to be accessible only to authorized administrators."}</p>
        <p className="leading-7">{"These reports may contain information about the reporting individual, the reported individual, the alleged conduct, supporting explanations, and administrative decisions."}</p>
        <p className="leading-7">{"We use this information to assess reports, maintain community safety, enforce applicable policies, and respond to legal obligations."}</p>
        <p className="leading-7">{"We do not publish moderation reports as ordinary public content, and we do not intentionally disclose a reporter's identity to the reported participant unless required by law."}</p>
        <p className="leading-7">{"Information may be disclosed when required by applicable law or lawful legal process, as described in Section 9."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"6. Cookies, Browser Storage, and Do Not Track"}</h2>
        <p className="leading-7">{"Quote.Vote uses browser storage and cookies to provide essential functionality."}</p>
        <p className="leading-7">{"These technologies may include:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"Authentication tokens used to maintain account sessions."}</li>
        <li className="pl-1">{"Session-related cookies used to recognize authenticated requests."}</li>
        <li className="pl-1">{"Locally stored preferences for appearance and interface behavior."}</li>
        <li className="pl-1">{"Temporary application information needed for navigation and functionality."}</li>
        </ul>
        <p className="leading-7">{"These mechanisms help provide the features participants request."}</p>
        <p className="leading-7">{"When you use payment features, a script from Stripe is loaded in your browser and Stripe may set its own cookies, subject to Stripe's privacy policy."}</p>
        <p className="leading-7">{"You can clear or restrict browser storage through your browser settings. Doing so may sign you out or affect your saved preferences."}</p>
        <p className="leading-7">{"Quote.Vote does not currently display third-party advertising and does not use third-party analytics or advertising trackers. We do not track participants across other websites over time."}</p>
        <p className="leading-7"><strong>{"Do Not Track:"}</strong>{" Some browsers send a \"Do Not Track\" signal. Because we do not track participants across third-party websites, we do not change our practices in response to that signal."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"7. Third-Party Service Providers"}</h2>
        <p className="leading-7">{"We rely on external service providers to operate Quote.Vote."}</p>
        <p className="leading-7">{"Our current infrastructure includes:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1"><strong>{"Netlify"}</strong>{" — Frontend application hosting."}</li>
        <li className="pl-1"><strong>{"Railway"}</strong>{" — Backend application hosting."}</li>
        <li className="pl-1"><strong>{"MongoDB"}</strong>{" — Database storage and related services."}</li>
        <li className="pl-1"><strong>{"SendGrid"}</strong>{" — Transactional email delivery, including invitations, account-related communications, and password resets."}</li>
        <li className="pl-1"><strong>{"Stripe"}</strong>{" — Payment processing for plans and payments."}</li>
        </ul>
        <p className="leading-7">{"These providers may process personal or technical information as necessary to provide services to Quote.Vote."}</p>
        <p className="leading-7">{"Their processing may include infrastructure operations, application requests, database storage, email delivery, payment processing, system diagnostics, and security-related functions."}</p>
        <p className="leading-7">{"If you connect a Solid Pod, your Pod is hosted by a provider you choose, and that provider's own privacy practices apply to information stored in your Pod."}</p>
        <p className="leading-7">{"We may change service providers as the platform evolves. We will update this Notice to reflect changes in the providers that process personal information."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"8. Sharing and Disclosure"}</h2>
        <p className="leading-7">{"We may share or disclose information in the following circumstances:"}</p>
        <p className="leading-7"><strong>{"Public participation:"}</strong>{" Information you choose to make public may be available to other participants and visitors."}</p>
        <p className="leading-7"><strong>{"Service providers:"}</strong>{" Providers may process information necessary to deliver hosting, storage, communications, payments, security, and other operational services."}</p>
        <p className="leading-7"><strong>{"Your instructions:"}</strong>{" We share information with a Solid Pod or other service when you ask us to."}</p>
        <p className="leading-7"><strong>{"Legal obligations:"}</strong>{" We may respond to valid legal process, as described in Section 9."}</p>
        <p className="leading-7"><strong>{"Security and enforcement:"}</strong>{" Information may be used or disclosed where reasonably necessary to investigate abuse, protect participants, secure the service, or enforce applicable agreements."}</p>
        <p className="leading-7"><strong>{"Organizational changes:"}</strong>{" Information may be transferred as part of a merger, acquisition, restructuring, or transfer of responsibility for operating the service. Any successor will be required to honor this Notice for information collected under it, or to give you notice and a choice before materially changing how that information is used."}</p>
        <p className="leading-7">{"We do not authorize unrestricted use of personal information by service providers for unrelated purposes."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"9. Law Enforcement and Legal Requests"}</h2>
        <p className="leading-7">{"We disclose information to government authorities or private parties only in response to valid legal process, such as a subpoena, court order, or search warrant, or where we believe in good faith that disclosure is necessary to prevent imminent death or serious physical harm."}</p>
        <p className="leading-7">{"We require a search warrant before disclosing the contents of direct messages or other private communications, unless the law permits disclosure without one, such as with the consent of a participant in the conversation or in an emergency."}</p>
        <p className="leading-7">{"We review each request and may object to requests that are overly broad or legally deficient."}</p>
        <p className="leading-7">{"Unless prohibited by law or court order, or where notice would create a risk of harm, we will try to notify affected participants before disclosing their information so that they have an opportunity to object."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"10. Data Retention"}</h2>
        <p className="leading-7">{"We keep information only as long as reasonably necessary for the purposes described in this Notice, unless a longer period is required by law. Our general retention periods are:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1"><strong>{"Account and profile information:"}</strong>{" while your account is active, and until deleted under Section 11."}</li>
        <li className="pl-1"><strong>{"Public contributions:"}</strong>{" while they remain part of the platform, unless you delete them or request deletion under Section 11."}</li>
        <li className="pl-1"><strong>{"Direct messages:"}</strong>{" while the conversation remains active for any participant."}</li>
        <li className="pl-1"><strong>{"Content you delete:"}</strong>{" removed from view immediately and permanently deleted within [30 days]."}</li>
        <li className="pl-1"><strong>{"IP addresses used for rate limiting:"}</strong>{" automatically deleted when the rate-limit window expires, generally within [24 hours]."}</li>
        <li className="pl-1"><strong>{"Operational and security logs:"}</strong>{" up to [90 days], unless needed to investigate a specific security incident."}</li>
        <li className="pl-1"><strong>{"Declined or expired invitation and access requests:"}</strong>{" up to [12 months]."}</li>
        <li className="pl-1"><strong>{"Moderation reports and enforcement records:"}</strong>{" up to [3 years] after the report is resolved."}</li>
        <li className="pl-1"><strong>{"Terms acceptance and payment records:"}</strong>{" for as long as needed to show acceptance or meet tax and accounting requirements, generally up to [7 years]."}</li>
        <li className="pl-1"><strong>{"Backups:"}</strong>{" overwritten on a rolling basis within [35 days]."}</li>
        </ul>
        <p className="leading-7">{"Certain records may need to be preserved longer for security, legal compliance, dispute resolution, or other lawful purposes."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"11. Account Deactivation and Deletion"}</h2>
        <p className="leading-7">{"You may request deactivation or deletion of your account by contacting "}<strong><a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></strong>{". We may ask for information reasonably necessary to verify that the request comes from the account holder."}</p>
        <p className="leading-7"><strong>{"Deactivation:"}</strong>{" A deactivated account can no longer be used to sign in. Deactivation alone does not delete your information."}</p>
        <p className="leading-7"><strong>{"Deletion:"}</strong>{" After verifying a deletion request, we will, within 45 days:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"Delete your email address, profile information, authentication information, Solid Pod connection, and account settings."}</li>
        <li className="pl-1">{"Delete, or remove from public view and then permanently delete, the posts, comments, quotations, and direct messages you authored."}</li>
        <li className="pl-1">{"Remove your account's association with your votes and reactions. Vote totals may continue to reflect votes in a form that no longer identifies you."}</li>
        </ul>
        <p className="leading-7">{"Other participants' independently authored contributions may remain, including passages they quoted from your content. On request, we will remove attribution to your account from those quotations where technically feasible."}</p>
        <p className="leading-7">{"We may keep a limited record of your terms acceptance, moderation history, payment records, and any information we must retain by law, in a form that identifies you only where necessary. Information in backups is deleted when the backups are overwritten, as described in Section 10."}</p>
        <p className="leading-7">{"Information previously copied or shared outside Quote.Vote may remain beyond our control."}</p>
        <p className="leading-7">{"We will tell you if any part of your request cannot be fulfilled and why."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"12. Your Privacy Rights and Choices"}</h2>
        <p className="leading-7">{"You may contact "}<strong><a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></strong>{" to request:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"Access to personal information associated with your account."}</li>
        <li className="pl-1">{"A copy of personal information you provided, in a portable format."}</li>
        <li className="pl-1">{"Correction of inaccurate personal information."}</li>
        <li className="pl-1">{"Closure or deletion of your account."}</li>
        <li className="pl-1">{"Deletion of information you authored, where applicable."}</li>
        <li className="pl-1">{"Information about our processing and disclosure practices."}</li>
        <li className="pl-1">{"Assistance with a privacy complaint or concern."}</li>
        </ul>
        <p className="leading-7">{"Depending on applicable law and your location, additional rights may include objecting to or restricting particular processing and withdrawing consent where processing relies on consent."}</p>
        <p className="leading-7">{"We may request information reasonably necessary to verify your identity before processing certain requests. We aim to respond within 45 days and will tell you if we need more time."}</p>
        <p className="leading-7">{"Requests will be evaluated and handled in accordance with applicable law. Some information may be subject to lawful exceptions."}</p>
        <p className="leading-7">{"We do not discriminate against participants for exercising privacy rights."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"13. Information Security"}</h2>
        <p className="leading-7">{"We use technical and organizational practices intended to protect information against unauthorized access, alteration, disclosure, and loss."}</p>
        <p className="leading-7">{"These practices include account authentication, password hashing, encryption of stored Solid Pod credentials, and access restrictions."}</p>
        <p className="leading-7">{"We continue to evaluate and improve security as the platform develops."}</p>
        <p className="leading-7">{"No internet-based service can guarantee absolute security."}</p>
        <p className="leading-7">{"If we learn of a security incident affecting your personal information, we will notify you and any applicable authorities as required by law."}</p>
        <p className="leading-7">{"If you believe your account has been compromised or discover a security concern, contact "}<strong><a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></strong>{"."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"14. Children's Privacy"}</h2>
        <p className="leading-7">{"Quote.Vote is not directed to children under 13, and participants must meet the eligibility requirements described in our "}<a href="/terms" className="underline underline-offset-2">{"Terms of Service"}</a>{"."}</p>
        <p className="leading-7">{"We do not knowingly collect personal information from children under 13."}</p>
        <p className="leading-7">{"If we learn that we have collected personal information from a child under 13, we will promptly delete it and close the account."}</p>
        <p className="leading-7">{"Parents or guardians who believe a child under 13 has provided information to Quote.Vote may contact "}<strong><a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></strong>{"."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"15. International Participation"}</h2>
        <p className="leading-7">{"Quote.Vote is operated from the United States and may be accessible to people located outside the United States."}</p>
        <p className="leading-7">{"Information is processed and stored in the United States and in other jurisdictions where our service providers maintain infrastructure."}</p>
        <p className="leading-7">{"Privacy protections and legal requirements vary by jurisdiction."}</p>
        <p className="leading-7">{"Where applicable law imposes additional obligations concerning international data processing or transfers, we will seek to comply with those requirements."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"16. Open Source, Solid Pods, and Data Portability"}</h2>
        <p className="leading-7">{"Quote.Vote is developed as an open-source project."}</p>
        <p className="leading-7">{"The availability of our source code does not make private account records, personal information, or restricted communications publicly available."}</p>
        <p className="leading-7">{"Quote.Vote supports optional connection to a Solid Pod, which lets you keep a copy of your profile, preferences, and activity in storage you control. Using this feature is your choice, and you can disconnect at any time."}</p>
        <p className="leading-7">{"We are continuing to develop portability and user-controlled storage features. New capabilities will be described in this Notice when available."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"17. Other Quote.Vote Deployments"}</h2>
        <p className="leading-7">{"Because Quote.Vote is open-source software, other people and organizations may run their own copies of it. This Notice does not apply to those deployments. The operator of each deployment decides how it collects and uses personal information and is responsible for its own privacy practices."}</p>
        <p className="leading-7">{"Where Quote Dot Vote, PBC hosts a deployment for a customer organization, we process personal information in that deployment on the customer's behalf and according to its instructions and our agreement with it. Questions about such a deployment should first be directed to the organization that operates it."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"18. Changes to This Privacy Notice"}</h2>
        <p className="leading-7">{"We may revise this Notice when our services, infrastructure, information practices, or legal obligations change."}</p>
        <p className="leading-7">{"We will post the revised Notice on this page and update the effective date at the top. We will keep prior versions available on request."}</p>
        <p className="leading-7">{"If we make material changes, we will notify account holders by email or by a prominent notice in the service before the changes take effect. Where required by applicable law, we will obtain consent before materially changing how previously collected personal information is processed."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"19. Contact"}</h2>
        <p className="leading-7">{"Questions, concerns, complaints, and requests concerning privacy may be directed to:"}</p>
        <p className="leading-7"><strong>{"Quote.Vote"}</strong><br />{"Operated by Quote Dot Vote, PBC"}<br />{"Email: "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a><br />{"Website: "}<a href="https://quote.vote" className="underline underline-offset-2">{"https://quote.vote"}</a></p>
        <p className="leading-7">{"We welcome good-faith questions about our privacy practices and opportunities to make them clearer."}</p>
        <p className="leading-7">{"Our objective is to provide a space for thoughtful participation while respecting the privacy, autonomy, and legitimate interests of the people who use it."}</p>
      </article>
    </main>
  )
}
