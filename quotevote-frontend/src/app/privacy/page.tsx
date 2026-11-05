import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Notice - Quote.Vote',
  description: 'Learn how Quote.Vote collects, uses, shares, stores, and responds to requests about personal information.',
}

// Founder-approved privacy copy (2026-10-09), tracked in issue #566.
// Before release, set the actual effective date and verify operational claims.
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <article className="space-y-5 text-base text-foreground">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{"Quote.Vote Privacy Notice"}</h1>
        <p className="leading-7"><strong>{"Effective date:"}</strong>{" To be established upon publication "}<strong>{"Privacy contact:"}</strong>{" "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"Our Commitment to Privacy"}</h2>
        <p className="leading-7">{"Quote.Vote is an open-source platform designed to encourage thoughtful, evidence-informed discussion."}</p>
        <p className="leading-7">{"We believe people should understand what information a platform collects, how it is used, who can access it, and what choices are available to them."}</p>
        <p className="leading-7">{"This Privacy Notice explains how personal information is handled when you visit Quote.Vote, create an account, participate in discussions, communicate with other members, or contact us."}</p>
        <p className="leading-7">{"Quote.Vote is operated by "}<strong>{"Quote Dot Vote, PBC"}</strong>{", a Delaware public benefit corporation (\"Quote.Vote,\" \"we,\" \"us,\" or \"our\")."}</p>
        <p className="leading-7">{"Questions or requests concerning privacy may be directed to "}<strong><a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></strong>{"."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"1. Information We Collect"}</h2>
        <p className="leading-7">{"We collect and process information necessary to provide, maintain, secure, and improve Quote.Vote."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Account and profile information"}</h3>
        <p className="leading-7">{"When you register or manage an account, we may collect:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"Email address and username."}</li>
        <li className="pl-1">{"Name, biography, avatar, and other profile information you choose to provide."}</li>
        <li className="pl-1">{"Password credentials and authentication information."}</li>
        <li className="pl-1">{"Account preferences and settings."}</li>
        <li className="pl-1">{"Invitation requests, invitation status, and registration information."}</li>
        <li className="pl-1">{"Communications you send to Quote.Vote."}</li>
        </ul>
        <p className="leading-7">{"Passwords are processed for account authentication. Our application uses password hashing to protect stored credentials."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Participation and discussion information"}</h3>
        <p className="leading-7">{"When you use Quote.Vote, we may collect and store:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"Posts and other written contributions."}</li>
        <li className="pl-1">{"Selected passages and quotations."}</li>
        <li className="pl-1">{"Votes, reactions, comments, and discussion activity."}</li>
        <li className="pl-1">{"Messages and conversation participation."}</li>
        <li className="pl-1">{"Follow relationships, connections, and blocked accounts."}</li>
        <li className="pl-1">{"Notifications and activity history."}</li>
        <li className="pl-1">{"Reports concerning accounts or content."}</li>
        </ul>
        <p className="leading-7">{"Certain communication features also process online presence, typing indicators, message delivery status, and read receipts."}</p>
        <h3 className="pt-3 text-lg font-semibold">{"Technical and operational information"}</h3>
        <p className="leading-7">{"When you access the service, Quote.Vote and its infrastructure providers may process:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"IP addresses and basic browser or device information."}</li>
        <li className="pl-1">{"Authentication tokens and session information."}</li>
        <li className="pl-1">{"Request times, application errors, and operational logs."}</li>
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
        <li className="pl-1">{"Respond to requests, complaints, and reports."}</li>
        <li className="pl-1">{"Investigate potential violations of our "}<a href="/terms" className="underline underline-offset-2">{"Terms of Service"}</a>{" or Code of Conduct."}</li>
        <li className="pl-1">{"Protect accounts, participants, and infrastructure."}</li>
        <li className="pl-1">{"Diagnose technical problems and improve service reliability and accessibility."}</li>
        <li className="pl-1">{"Comply with applicable laws and lawful legal processes."}</li>
        </ul>
        <p className="leading-7">{"We may evaluate aggregate patterns of service usage and technical performance to understand how well the platform operates. Such processing may involve personal information where necessary."}</p>
        <p className="leading-7">{"We do not sell personal information to advertisers or use participant information to deliver behaviorally targeted advertising."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"3. Public Information and Discussions"}</h2>
        <p className="leading-7">{"Quote.Vote is designed to facilitate public discourse."}</p>
        <p className="leading-7">{"Information you choose to publish through public-facing features—including profiles, posts, quotations, votes, and comments—may be visible to other participants and, where the feature permits, visitors without accounts."}</p>
        <p className="leading-7">{"Other participants may respond to, quote, link to, or reference your public contributions."}</p>
        <p className="leading-7">{"Public information may also be copied or preserved by other people outside Quote.Vote."}</p>
        <p className="leading-7">{"You should consider these possibilities before posting personal or sensitive information in public discussions."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"4. Direct Messages and Private Communications"}</h2>
        <p className="leading-7">{"Direct messages are intended to be accessible only to the participants in a conversation and authorized Quote.Vote administrators."}</p>
        <p className="leading-7">{"Administrators may need access to communications for legitimate operational purposes, including responding to reports, investigating abuse, resolving technical problems, or complying with legal requirements."}</p>
        <p className="leading-7">{"Direct messages are not treated as publicly published contributions merely because they are stored on Quote.Vote."}</p>
        <p className="leading-7">{"However, participants in a conversation may independently copy, record, or share messages they receive. Quote.Vote cannot control every subsequent use of information disclosed by another participant."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"5. Moderation Reports"}</h2>
        <p className="leading-7">{"Reports about users, content, or potential violations of our community standards are intended to be accessible only to authorized administrators."}</p>
        <p className="leading-7">{"These reports may contain information about the reporting individual, the reported individual, the alleged conduct, supporting explanations, and administrative decisions."}</p>
        <p className="leading-7">{"We use this information to assess reports, maintain community safety, enforce applicable policies, and respond to legal obligations."}</p>
        <p className="leading-7">{"We do not publish moderation reports as ordinary public content."}</p>
        <p className="leading-7">{"Information may be disclosed when required by applicable law or lawful legal process."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"6. Cookies and Browser Storage"}</h2>
        <p className="leading-7">{"Quote.Vote uses browser storage and cookies to provide essential functionality."}</p>
        <p className="leading-7">{"These technologies may include:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"Authentication tokens used to maintain account sessions."}</li>
        <li className="pl-1">{"Session-related cookies used to recognize authenticated requests."}</li>
        <li className="pl-1">{"Locally stored preferences for appearance and interface behavior."}</li>
        <li className="pl-1">{"Temporary application information needed for navigation and functionality."}</li>
        </ul>
        <p className="leading-7">{"These mechanisms help provide the features participants request."}</p>
        <p className="leading-7">{"Authentication and technical operations may involve processing information about interactions with the service."}</p>
        <p className="leading-7">{"You can clear or restrict browser storage through your browser settings. Doing so may sign you out or affect your saved preferences."}</p>
        <p className="leading-7">{"Quote.Vote does not currently display third-party advertising."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"7. Third-Party Service Providers"}</h2>
        <p className="leading-7">{"We rely on external service providers to operate Quote.Vote."}</p>
        <p className="leading-7">{"Our current infrastructure includes:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1"><strong>{"Netlify"}</strong>{" — Frontend application hosting."}</li>
        <li className="pl-1"><strong>{"Railway"}</strong>{" — Backend application hosting."}</li>
        <li className="pl-1"><strong>{"MongoDB"}</strong>{" — Database storage and related services."}</li>
        <li className="pl-1"><strong>{"SendGrid"}</strong>{" — Transactional email delivery, including invitations, account-related communications, and password resets."}</li>
        </ul>
        <p className="leading-7">{"These providers may process personal or technical information as necessary to provide services to Quote.Vote."}</p>
        <p className="leading-7">{"Their processing may include infrastructure operations, application requests, database storage, email delivery, system diagnostics, and security-related functions."}</p>
        <p className="leading-7">{"We may change service providers as the platform evolves. Material changes to our data practices will be reflected in updates to this Notice where appropriate."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"8. Sharing and Disclosure"}</h2>
        <p className="leading-7">{"We may share or disclose information in the following circumstances:"}</p>
        <p className="leading-7"><strong>{"Public participation:"}</strong>{" Information you choose to make public may be available to other participants and visitors."}</p>
        <p className="leading-7"><strong>{"Service providers:"}</strong>{" Providers may process information necessary to deliver hosting, storage, communications, security, and other operational services."}</p>
        <p className="leading-7"><strong>{"Legal obligations:"}</strong>{" We may respond to valid legal demands, including court orders, subpoenas, and other applicable legal processes."}</p>
        <p className="leading-7"><strong>{"Security and enforcement:"}</strong>{" Information may be used or disclosed where reasonably necessary to investigate abuse, protect participants, secure the service, or enforce applicable agreements."}</p>
        <p className="leading-7"><strong>{"Organizational changes:"}</strong>{" Information may be transferred as part of a merger, acquisition, restructuring, or transfer of responsibility for operating the service, subject to applicable legal requirements."}</p>
        <p className="leading-7">{"We do not authorize unrestricted use of personal information by service providers for unrelated purposes."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"9. Data Retention"}</h2>
        <p className="leading-7">{"Quote.Vote may retain account information, contributions, and related records for as long as reasonably necessary to operate the service, support ongoing discussions, and fulfill legitimate operational or legal purposes."}</p>
        <p className="leading-7">{"We have not established a universal expiration period for every category of data."}</p>
        <p className="leading-7">{"Some information may remain stored indefinitely while an account is active or content remains part of the platform."}</p>
        <p className="leading-7">{"Retention practices may differ for account records, public contributions, private communications, moderation reports, security logs, and backups."}</p>
        <p className="leading-7">{"When information is no longer reasonably necessary, or when deletion is required under applicable law, we will take appropriate steps to delete or otherwise handle that information."}</p>
        <p className="leading-7">{"Certain records may need to be preserved for security, legal compliance, dispute resolution, or other lawful purposes."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"10. Account Deletion and Your Contributions"}</h2>
        <p className="leading-7">{"You may request deletion of your account and personal information by contacting "}<strong><a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></strong>{"."}</p>
        <p className="leading-7">{"Our intended policy is to remove the requesting participant's account information and their own authored public contributions from active service systems after the request has been appropriately verified and processed, subject to applicable legal requirements and technical limitations."}</p>
        <p className="leading-7">{"Deletion may affect posts, quotations, comments, votes, and other contributions associated with an account."}</p>
        <p className="leading-7">{"However, other participants' independently authored contributions may remain where lawful and appropriate, even when they refer to content that has been removed."}</p>
        <p className="leading-7">{"Some information may also remain temporarily in backups, security records, or systems operated by service providers. Where information must lawfully be retained, we may preserve the necessary records."}</p>
        <p className="leading-7">{"Information previously copied or shared outside Quote.Vote may remain beyond our control."}</p>
        <p className="leading-7">{"We will explain material limitations or exceptions when responding to deletion requests."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"11. Your Privacy Rights and Choices"}</h2>
        <p className="leading-7">{"You may contact "}<strong><a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></strong>{" to request:"}</p>
        <ul className="ml-6 list-disc space-y-2">
        <li className="pl-1">{"Access to personal information associated with your account."}</li>
        <li className="pl-1">{"Correction of inaccurate personal information."}</li>
        <li className="pl-1">{"Closure or deletion of your account."}</li>
        <li className="pl-1">{"Deletion of information you authored, where applicable."}</li>
        <li className="pl-1">{"Information about our processing and disclosure practices."}</li>
        <li className="pl-1">{"Assistance with a privacy complaint or concern."}</li>
        </ul>
        <p className="leading-7">{"Depending on applicable law and your location, additional rights may include receiving a portable copy of certain information, objecting to or restricting particular processing, and withdrawing consent where processing relies on consent."}</p>
        <p className="leading-7">{"We may request information reasonably necessary to verify your identity before processing certain requests."}</p>
        <p className="leading-7">{"Requests will be evaluated and handled in accordance with applicable law. Some information may be subject to lawful exceptions."}</p>
        <p className="leading-7">{"We do not discriminate against participants for exercising legally protected privacy rights."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"12. Information Security"}</h2>
        <p className="leading-7">{"We use technical and organizational practices intended to protect information against unauthorized access, alteration, disclosure, and loss."}</p>
        <p className="leading-7">{"These practices include account authentication, password hashing, and access restrictions."}</p>
        <p className="leading-7">{"We continue to evaluate and improve security as the platform develops."}</p>
        <p className="leading-7">{"No internet-based service can guarantee absolute security."}</p>
        <p className="leading-7">{"If you believe your account has been compromised or discover a security concern, contact "}<strong><a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></strong>{"."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"13. Children's Privacy"}</h2>
        <p className="leading-7">{"Quote.Vote is intended for participants who meet the eligibility requirements described in our "}<a href="/terms" className="underline underline-offset-2">{"Terms of Service"}</a>{"."}</p>
        <p className="leading-7">{"We do not knowingly solicit personal information from children under 13."}</p>
        <p className="leading-7">{"If we learn that information has been collected from a child in circumstances requiring parental consent that was not obtained, we will take appropriate action consistent with applicable law."}</p>
        <p className="leading-7">{"Parents or guardians may contact "}<strong><a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a></strong>{" with concerns."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"14. International Participation"}</h2>
        <p className="leading-7">{"Quote.Vote may be accessible to people located outside the United States."}</p>
        <p className="leading-7">{"Information may be processed or stored in the United States or other jurisdictions where our service providers maintain infrastructure."}</p>
        <p className="leading-7">{"Privacy protections and legal requirements vary by jurisdiction."}</p>
        <p className="leading-7">{"Where applicable law imposes additional obligations concerning international data processing or transfers, we will seek to comply with those requirements."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"15. Open Source and Data Autonomy"}</h2>
        <p className="leading-7">{"Quote.Vote is developed as an open-source project."}</p>
        <p className="leading-7">{"The availability of our source code does not make private account records, personal information, or restricted communications publicly available."}</p>
        <p className="leading-7">{"We are exploring technologies and approaches intended to give participants greater autonomy over their information, including portability and user-controlled storage."}</p>
        <p className="leading-7">{"These initiatives remain subject to development and implementation. Any new capabilities will be described when available."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"16. Changes to This Privacy Notice"}</h2>
        <p className="leading-7">{"We may revise this Notice when our services, infrastructure, information practices, or legal obligations change."}</p>
        <p className="leading-7">{"The current version and its effective date will be made available on Quote.Vote."}</p>
        <p className="leading-7">{"Where required by applicable law, we will provide additional notice or obtain consent before making material changes to how personal information is processed."}</p>
        <h2 className="pt-6 text-xl font-semibold tracking-tight">{"17. Contact"}</h2>
        <p className="leading-7">{"Questions, concerns, complaints, and requests concerning privacy may be directed to:"}</p>
        <p className="leading-7"><strong>{"Quote.Vote"}</strong>{" Operated by Quote Dot Vote, PBC Email: "}<a href="mailto:admin@quote.vote" className="underline underline-offset-2">{"admin@quote.vote"}</a>{" Website: "}<a href="https://quote.vote" className="underline underline-offset-2">{"https://quote.vote"}</a></p>
        <p className="leading-7">{"We welcome good-faith questions about our privacy practices and opportunities to make them clearer."}</p>
        <p className="leading-7">{"Our objective is to provide a space for thoughtful participation while respecting the privacy, autonomy, and legitimate interests of the people who use it."}</p>
      </article>
    </main>
  )
}
