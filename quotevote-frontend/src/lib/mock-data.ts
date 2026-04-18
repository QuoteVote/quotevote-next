/**
 * Mock data for populating the feed when no backend data is available.
 * Used as a fallback in PostsTab when the API returns empty results.
 */
import type { Post } from '@/types/post'
import type { Group } from '@/types/components'

// Helper to generate a realistic MongoDB ObjectId (24 hex chars)
function oid(seed: string): string {
  return seed.padEnd(24, '0').slice(0, 24)
}

export const MOCK_GROUPS: Group[] = [
  {
    _id: oid('g1a2b3c4d5e6f7a8b9c0d1e2'),
    title: 'General',
    description: 'General discussion for all topics',
    privacy: 'public',
    allowedUserIds: [],
  },
  {
    _id: oid('g2b3c4d5e6f7a8b9c0d1e2f3'),
    title: 'Technology',
    description: 'Tech news, software, and innovation',
    privacy: 'public',
    allowedUserIds: [],
  },
  {
    _id: oid('g3c4d5e6f7a8b9c0d1e2f3a4'),
    title: 'Philosophy',
    description: 'Ideas, ethics, and ways of thinking',
    privacy: 'public',
    allowedUserIds: [],
  },
  {
    _id: oid('g4d5e6f7a8b9c0d1e2f3a4b5'),
    title: 'Politics & Society',
    description: 'Civic discourse and social issues',
    privacy: 'public',
    allowedUserIds: [],
  },
  {
    _id: oid('g5e6f7a8b9c0d1e2f3a4b5c6'),
    title: 'Science',
    description: 'Research, discoveries, and evidence-based discussion',
    privacy: 'public',
    allowedUserIds: [],
  },
  {
    _id: oid('g6f7a8b9c0d1e2f3a4b5c6d7'),
    title: 'Culture & Arts',
    description: 'Literature, film, music, and creative work',
    privacy: 'public',
    allowedUserIds: [],
  },
]

// Mock user IDs for interactions
const userIds = {
  alex: oid('a1b2c3d4e5f6a1b2c3d4e5f6'),
  techguru: oid('b2c3d4e5f6a1b2c3d4e5f6a1'),
  philosophia: oid('c3d4e5f6a1b2c3d4e5f6a1b2'),
  newsHound: oid('d4e5f6a1b2c3d4e5f6a1b2c3'),
  sarahJ: oid('e5f6a1b2c3d4e5f6a1b2c3d4'),
  codeMaster: oid('f6a1b2c3d4e5f6a1b2c3d4e5'),
  urbanPoet: oid('a7b8c9d0e1f2a7b8c9d0e1f2'),
  civicMind: oid('b8c9d0e1f2a7b8c9d0e1f2a7'),
  reader01: oid('c9d0e1f2a3b4c9d0e1f2a3b4'),
  reader02: oid('d0e1f2a3b4c5d0e1f2a3b4c5'),
  reader03: oid('e1f2a3b4c5d6e1f2a3b4c5d6'),
  reader04: oid('f2a3b4c5d6e7f2a3b4c5d6e7'),
  reader05: oid('a3b4c5d6e7f8a3b4c5d6e7f8'),
  reader06: oid('b4c5d6e7f8a9b4c5d6e7f8a9'),
  reader07: oid('c5d6e7f8a9b0c5d6e7f8a9b0'),
  reader08: oid('d6e7f8a9b0c1d6e7f8a9b0c1'),
  reader09: oid('e7f8a9b0c1d2e7f8a9b0c1d2'),
  reader10: oid('f8a9b0c1d2e3f8a9b0c1d2e3'),
  reader11: oid('a9b0c1d2e3f4a9b0c1d2e3f4'),
  reader12: oid('b0c1d2e3f4a5b0c1d2e3f4a5'),
  reader13: oid('c1d2e3f4a5b6c1d2e3f4a5b6'),
  reader14: oid('d2e3f4a5b6c7d2e3f4a5b6c7'),
  reader15: oid('e3f4a5b6c7d8e3f4a5b6c7d8'),
}

const mockGroupId = oid('aabbccddeeff001122334455')

// Timestamps: from today back ~2 weeks
function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0)
  return d.toISOString()
}

export const MOCK_POSTS: Post[] = [
  // 1. AI and Jobs
  {
    _id: oid('660a1b2c3d4e5f6a7b8c9d0e'),
    userId: userIds.techguru,
    created: daysAgo(0),
    title: 'AI Will Create More Jobs Than It Destroys — But Not the Same Ones',
    text: 'Every major technological revolution has triggered the same fear: mass unemployment. The printing press, the loom, the assembly line — each one displaced workers in the short term but created entirely new industries within a generation. AI is following the same pattern, but the transition period matters enormously. We need to invest in retraining programs now, not after the displacement happens. The question is not whether AI will replace jobs, but whether we will prepare people for the jobs it creates.',
    url: '/dashboard/post/general/ai-will-create-more-jobs/660a1b2c3d4e5f6a7b8c9d0e',
    citationUrl: 'https://www.technologyreview.com/ai-workforce',
    approvedBy: [
      userIds.alex, userIds.philosophia, userIds.sarahJ, userIds.codeMaster,
      userIds.urbanPoet, userIds.civicMind, userIds.reader01, userIds.reader02,
      userIds.reader03, userIds.reader04, userIds.reader05, userIds.reader06,
      userIds.reader07,
    ],
    rejectedBy: [userIds.newsHound, userIds.reader08],
    bookmarkedBy: [userIds.alex, userIds.sarahJ, userIds.codeMaster],
    creator: {
      _id: userIds.techguru,
      username: 'techguru',
      name: 'Marcus Chen',
      avatar: undefined,
    },
    comments: [
      {
        _id: oid('cc01aa000000000000000001'),
        created: daysAgo(0),
        userId: userIds.alex,
        content: 'This is spot on. The transition is the hard part — we are terrible at retraining programs in the US.',
        user: { _id: userIds.alex, username: 'alex_writes', name: 'Alex Rivera' },
      },
      {
        _id: oid('cc01aa000000000000000002'),
        created: daysAgo(0),
        userId: userIds.philosophia,
        content: 'I think the bigger risk is not job loss but wage stagnation in the middle tier.',
        user: { _id: userIds.philosophia, username: 'philosophia', name: 'Priya Sharma' },
      },
      {
        _id: oid('cc01aa000000000000000003'),
        created: daysAgo(0),
        userId: userIds.sarahJ,
        content: 'Germany has a good model with their apprenticeship system. We should look at that.',
        user: { _id: userIds.sarahJ, username: 'sarah_j', name: 'Sarah Johnson' },
      },
    ],
    votes: [
      { _id: oid('vv01000000000000000001'), type: 'UP', startWordIndex: 0, endWordIndex: 8 },
      { _id: oid('vv01000000000000000002'), type: 'UP', startWordIndex: 40, endWordIndex: 55 },
      { _id: oid('vv01000000000000000003'), type: 'DOWN', startWordIndex: 60, endWordIndex: 70 },
    ],
    quotes: [
      { _id: oid('qq01000000000000000001'), quote: 'The question is not whether AI will replace jobs, but whether we will prepare people for the jobs it creates.' },
    ],
    groupId: null,
    enable_voting: true,
  },

  // 2. Climate Change Policy
  {
    _id: oid('660b2c3d4e5f6a7b8c9d0e1f'),
    userId: userIds.civicMind,
    created: daysAgo(1),
    title: 'Carbon Pricing Works — When It Is Designed Correctly',
    text: 'British Columbia introduced a revenue-neutral carbon tax in 2008 and saw emissions drop 15% while the economy grew faster than the rest of Canada. The key was returning every dollar to citizens through tax cuts, making it politically sustainable. Meanwhile, cap-and-trade systems in Europe struggled with over-allocation of permits. The lesson is clear: simplicity and transparency in carbon pricing builds public trust. We do not need perfect policy — we need good policy that people will actually support long enough to work.',
    url: '/dashboard/post/general/carbon-pricing-works/660b2c3d4e5f6a7b8c9d0e1f',
    citationUrl: 'https://www.nature.com/articles/climate-policy',
    approvedBy: [
      userIds.alex, userIds.techguru, userIds.philosophia, userIds.sarahJ,
      userIds.urbanPoet, userIds.reader01, userIds.reader02, userIds.reader03,
      userIds.reader04, userIds.reader05,
    ],
    rejectedBy: [userIds.reader06, userIds.reader07, userIds.reader08],
    bookmarkedBy: [userIds.philosophia, userIds.urbanPoet],
    creator: {
      _id: userIds.civicMind,
      username: 'civic_mind',
      name: 'Jordan Osei',
      avatar: undefined,
    },
    comments: [
      {
        _id: oid('cc02aa000000000000000001'),
        created: daysAgo(1),
        userId: userIds.techguru,
        content: 'Revenue-neutral is the key phrase here. People oppose carbon taxes because they think it is just another way to take their money.',
        user: { _id: userIds.techguru, username: 'techguru', name: 'Marcus Chen' },
      },
      {
        _id: oid('cc02aa000000000000000002'),
        created: daysAgo(1),
        userId: userIds.reader01,
        content: 'BC is a great case study but scaling this nationally is a different challenge entirely.',
        user: { _id: userIds.reader01, username: 'reader01', name: 'Chris Taylor' },
      },
    ],
    votes: [
      { _id: oid('vv02000000000000000001'), type: 'UP', startWordIndex: 0, endWordIndex: 10 },
      { _id: oid('vv02000000000000000002'), type: 'UP', startWordIndex: 30, endWordIndex: 45 },
    ],
    quotes: [
      { _id: oid('qq02000000000000000001'), quote: 'We do not need perfect policy — we need good policy that people will actually support long enough to work.' },
    ],
    groupId: null,
    enable_voting: true,
  },

  // 3. Open Source Software
  {
    _id: oid('660c3d4e5f6a7b8c9d0e1f2a'),
    userId: userIds.codeMaster,
    created: daysAgo(3),
    title: 'The Hidden Cost of "Free" Open Source Software',
    text: 'We built trillion-dollar industries on top of code maintained by unpaid volunteers. When the Log4j vulnerability hit in 2021, the world discovered that a critical piece of internet infrastructure was maintained by two people in their spare time. Open source is not free — the cost is just hidden and deferred. Companies that depend on open source should fund it proportionally. Some are starting to: GitHub Sponsors, Tidelift, and corporate OSPO teams are steps in the right direction, but we are nowhere close to sustainable.',
    url: '/dashboard/post/general/hidden-cost-open-source/660c3d4e5f6a7b8c9d0e1f2a',
    citationUrl: 'https://www.wired.com/open-source-sustainability',
    approvedBy: [
      userIds.alex, userIds.techguru, userIds.sarahJ, userIds.newsHound,
      userIds.reader01, userIds.reader02, userIds.reader03, userIds.reader04,
      userIds.reader05, userIds.reader06, userIds.reader07, userIds.reader08,
      userIds.reader09, userIds.reader10, userIds.reader11,
    ],
    rejectedBy: [userIds.reader12],
    bookmarkedBy: [userIds.techguru, userIds.codeMaster, userIds.alex, userIds.sarahJ],
    creator: {
      _id: userIds.codeMaster,
      username: 'code_master',
      name: 'Lena Kowalski',
      avatar: undefined,
    },
    comments: [
      {
        _id: oid('cc03aa000000000000000001'),
        created: daysAgo(3),
        userId: userIds.techguru,
        content: 'Log4j was a wake-up call. I remember scrambling to patch production systems over the holidays.',
        user: { _id: userIds.techguru, username: 'techguru', name: 'Marcus Chen' },
      },
      {
        _id: oid('cc03aa000000000000000002'),
        created: daysAgo(2),
        userId: userIds.alex,
        content: 'My company started a $50k annual open source fund last year. It is not much but it is a start.',
        user: { _id: userIds.alex, username: 'alex_writes', name: 'Alex Rivera' },
      },
      {
        _id: oid('cc03aa000000000000000003'),
        created: daysAgo(2),
        userId: userIds.sarahJ,
        content: 'The biggest problem is that maintainers burn out before funding reaches them.',
        user: { _id: userIds.sarahJ, username: 'sarah_j', name: 'Sarah Johnson' },
      },
      {
        _id: oid('cc03aa000000000000000004'),
        created: daysAgo(2),
        userId: userIds.newsHound,
        content: 'Great post. Should be required reading for every CTO.',
        user: { _id: userIds.newsHound, username: 'news_hound', name: 'Derek Fowler' },
      },
    ],
    votes: [
      { _id: oid('vv03000000000000000001'), type: 'UP', startWordIndex: 0, endWordIndex: 12 },
      { _id: oid('vv03000000000000000002'), type: 'UP', startWordIndex: 15, endWordIndex: 30 },
      { _id: oid('vv03000000000000000003'), type: 'UP', startWordIndex: 50, endWordIndex: 65 },
    ],
    quotes: [
      { _id: oid('qq03000000000000000001'), quote: 'Open source is not free — the cost is just hidden and deferred.' },
    ],
    groupId: null,
    enable_voting: true,
  },

  // 4. Social Media Algorithms
  {
    _id: oid('660d4e5f6a7b8c9d0e1f2a3b'),
    userId: userIds.philosophia,
    created: daysAgo(4),
    title: 'Algorithmic Feeds Are Optimizing for the Wrong Thing',
    text: 'Social media algorithms optimize for engagement, and the most engaging content is often the most outrageous. This is not a bug — it is the core business model. When your revenue depends on time-on-site, you are incentivized to show people content that makes them angry, anxious, or addicted. The alternative is not no algorithms at all. It is algorithms designed around different goals: understanding, connection, or even boredom. What if a feed algorithm optimized for the probability you would feel good about your time spent, rather than just the amount of it?',
    url: '/dashboard/post/general/algorithmic-feeds-wrong/660d4e5f6a7b8c9d0e1f2a3b',
    approvedBy: [
      userIds.alex, userIds.techguru, userIds.civicMind, userIds.sarahJ,
      userIds.urbanPoet, userIds.newsHound, userIds.reader01, userIds.reader02,
      userIds.reader03,
    ],
    rejectedBy: [userIds.reader04, userIds.reader05, userIds.reader06, userIds.reader07],
    bookmarkedBy: [userIds.philosophia, userIds.civicMind],
    creator: {
      _id: userIds.philosophia,
      username: 'philosophia',
      name: 'Priya Sharma',
      avatar: undefined,
    },
    comments: [
      {
        _id: oid('cc04aa000000000000000001'),
        created: daysAgo(4),
        userId: userIds.civicMind,
        content: 'This is exactly why platforms like Quote.Vote matter — the incentive structure is different when voting drives curation.',
        user: { _id: userIds.civicMind, username: 'civic_mind', name: 'Jordan Osei' },
      },
      {
        _id: oid('cc04aa000000000000000002'),
        created: daysAgo(3),
        userId: userIds.urbanPoet,
        content: 'An algorithm that optimized for boredom would be revolutionary. Sometimes the best thing is to put the phone down.',
        user: { _id: userIds.urbanPoet, username: 'urban_poet', name: 'Maya Lin' },
      },
    ],
    votes: [
      { _id: oid('vv04000000000000000001'), type: 'UP', startWordIndex: 0, endWordIndex: 15 },
      { _id: oid('vv04000000000000000002'), type: 'DOWN', startWordIndex: 40, endWordIndex: 50 },
      { _id: oid('vv04000000000000000003'), type: 'UP', startWordIndex: 60, endWordIndex: 80 },
      { _id: oid('vv04000000000000000004'), type: 'UP', startWordIndex: 80, endWordIndex: 95 },
    ],
    quotes: [
      { _id: oid('qq04000000000000000001'), quote: 'What if a feed algorithm optimized for the probability you would feel good about your time spent, rather than just the amount of it?' },
    ],
    groupId: null,
    enable_voting: true,
  },

  // 5. Urban Planning
  {
    _id: oid('660e5f6a7b8c9d0e1f2a3b4c'),
    userId: userIds.urbanPoet,
    created: daysAgo(5),
    title: 'Why Every City Should Have a 15-Minute Neighborhood Plan',
    text: 'The 15-minute city concept is simple: every resident should be able to reach essential services — groceries, healthcare, schools, parks — within a 15-minute walk or bike ride. Paris has been redesigning around this idea since 2020, and the results are striking: lower car usage, stronger local businesses, and measurably higher quality of life scores. The biggest obstacle is not urban design, it is zoning laws written in the 1950s that mandate single-use neighborhoods. We do not need flying cars — we need to let people live near where they work and shop.',
    url: '/dashboard/post/general/15-minute-neighborhood/660e5f6a7b8c9d0e1f2a3b4c',
    citationUrl: 'https://www.bloomberg.com/citylab/15-minute-city',
    approvedBy: [
      userIds.alex, userIds.philosophia, userIds.civicMind, userIds.sarahJ,
      userIds.reader01, userIds.reader02, userIds.reader03,
    ],
    rejectedBy: [userIds.reader04],
    bookmarkedBy: [userIds.urbanPoet, userIds.civicMind, userIds.sarahJ],
    creator: {
      _id: userIds.urbanPoet,
      username: 'urban_poet',
      name: 'Maya Lin',
      avatar: undefined,
    },
    comments: [
      {
        _id: oid('cc05aa000000000000000001'),
        created: daysAgo(5),
        userId: userIds.civicMind,
        content: 'Zoning reform is the unsexy answer to so many problems: housing, climate, health, loneliness.',
        user: { _id: userIds.civicMind, username: 'civic_mind', name: 'Jordan Osei' },
      },
      {
        _id: oid('cc05aa000000000000000002'),
        created: daysAgo(4),
        userId: userIds.sarahJ,
        content: 'I moved from a car-dependent suburb to a walkable neighborhood last year. The difference in daily stress is enormous.',
        user: { _id: userIds.sarahJ, username: 'sarah_j', name: 'Sarah Johnson' },
      },
    ],
    votes: [
      { _id: oid('vv05000000000000000001'), type: 'UP', startWordIndex: 0, endWordIndex: 12 },
      { _id: oid('vv05000000000000000002'), type: 'UP', startWordIndex: 25, endWordIndex: 40 },
    ],
    quotes: [
      { _id: oid('qq05000000000000000001'), quote: 'We do not need flying cars — we need to let people live near where they work and shop.' },
    ],
    groupId: mockGroupId,
    enable_voting: true,
  },

  // 6. Education Reform
  {
    _id: oid('660f6a7b8c9d0e1f2a3b4c5d'),
    userId: userIds.sarahJ,
    created: daysAgo(7),
    title: 'We Are Teaching Kids to Pass Tests, Not to Think',
    text: 'Finland consistently ranks among the top education systems in the world, and they have no standardized testing until age 16. Students spend more time in unstructured play, less time in the classroom, and teachers are given the autonomy to design their own curricula. Meanwhile, in the US and UK, we doubled down on standardized testing after No Child Left Behind and saw stagnant or declining outcomes. The evidence is overwhelming: creativity, critical thinking, and intrinsic motivation cannot be measured by bubble sheets. We need to trust teachers and let kids be curious.',
    url: '/dashboard/post/general/teaching-kids-to-think/660f6a7b8c9d0e1f2a3b4c5d',
    citationUrl: 'https://www.theatlantic.com/education/finland-model',
    approvedBy: [
      userIds.alex, userIds.techguru, userIds.philosophia, userIds.civicMind,
      userIds.urbanPoet, userIds.newsHound, userIds.codeMaster, userIds.reader01,
      userIds.reader02, userIds.reader03, userIds.reader04, userIds.reader05,
    ],
    rejectedBy: [userIds.reader06, userIds.reader07],
    bookmarkedBy: [userIds.sarahJ, userIds.philosophia, userIds.reader01],
    creator: {
      _id: userIds.sarahJ,
      username: 'sarah_j',
      name: 'Sarah Johnson',
      avatar: undefined,
    },
    comments: [
      {
        _id: oid('cc06aa000000000000000001'),
        created: daysAgo(7),
        userId: userIds.philosophia,
        content: 'This resonates deeply. I was a teacher for 5 years before switching careers, and the testing pressure destroyed my ability to actually educate.',
        user: { _id: userIds.philosophia, username: 'philosophia', name: 'Priya Sharma' },
      },
      {
        _id: oid('cc06aa000000000000000002'),
        created: daysAgo(6),
        userId: userIds.codeMaster,
        content: 'As someone in tech, I can confirm: the most valuable skill is learning how to learn, not memorizing facts.',
        user: { _id: userIds.codeMaster, username: 'code_master', name: 'Lena Kowalski' },
      },
      {
        _id: oid('cc06aa000000000000000003'),
        created: daysAgo(6),
        userId: userIds.newsHound,
        content: 'Finland also pays teachers very well and requires a masters degree. That is part of the equation too.',
        user: { _id: userIds.newsHound, username: 'news_hound', name: 'Derek Fowler' },
      },
    ],
    votes: [
      { _id: oid('vv06000000000000000001'), type: 'UP', startWordIndex: 0, endWordIndex: 10 },
      { _id: oid('vv06000000000000000002'), type: 'UP', startWordIndex: 20, endWordIndex: 35 },
      { _id: oid('vv06000000000000000003'), type: 'UP', startWordIndex: 70, endWordIndex: 85 },
      { _id: oid('vv06000000000000000004'), type: 'DOWN', startWordIndex: 50, endWordIndex: 60 },
    ],
    quotes: [
      { _id: oid('qq06000000000000000001'), quote: 'Creativity, critical thinking, and intrinsic motivation cannot be measured by bubble sheets.' },
    ],
    groupId: null,
    enable_voting: true,
  },

  // 7. Famous Book Passage
  {
    _id: oid('6610a7b8c9d0e1f2a3b4c5d6'),
    userId: userIds.alex,
    created: daysAgo(10),
    title: 'Orwell Predicted It, But Not Like This',
    text: '"It was a bright cold day in April, and the clocks were striking thirteen." Orwell imagined totalitarianism imposed from above — a boot stamping on a human face forever. What we got instead is closer to Huxley: we are drowning ourselves in information, distracted by an infinite scroll of entertainment, voluntarily surrendering our attention and data in exchange for convenience. The surveillance state did not need to be imposed. We bought the cameras, installed them in our homes, and carry them in our pockets. The dystopia is opt-in.',
    url: '/dashboard/post/general/orwell-predicted-it/6610a7b8c9d0e1f2a3b4c5d6',
    citationUrl: 'https://www.gutenberg.org/ebooks/1984',
    approvedBy: [
      userIds.techguru, userIds.philosophia, userIds.sarahJ, userIds.codeMaster,
      userIds.urbanPoet, userIds.civicMind, userIds.newsHound, userIds.reader01,
    ],
    rejectedBy: [userIds.reader02, userIds.reader03],
    bookmarkedBy: [userIds.alex, userIds.philosophia, userIds.urbanPoet, userIds.newsHound],
    creator: {
      _id: userIds.alex,
      username: 'alex_writes',
      name: 'Alex Rivera',
      avatar: undefined,
    },
    comments: [
      {
        _id: oid('cc07aa000000000000000001'),
        created: daysAgo(10),
        userId: userIds.philosophia,
        content: 'Neil Postman made this exact argument in Amusing Ourselves to Death. Huxley was more right than Orwell.',
        user: { _id: userIds.philosophia, username: 'philosophia', name: 'Priya Sharma' },
      },
      {
        _id: oid('cc07aa000000000000000002'),
        created: daysAgo(9),
        userId: userIds.codeMaster,
        content: 'The opt-in framing is important. Nobody forced us to put Alexa in the bedroom.',
        user: { _id: userIds.codeMaster, username: 'code_master', name: 'Lena Kowalski' },
      },
    ],
    votes: [
      { _id: oid('vv07000000000000000001'), type: 'UP', startWordIndex: 0, endWordIndex: 15 },
      { _id: oid('vv07000000000000000002'), type: 'UP', startWordIndex: 50, endWordIndex: 70 },
    ],
    quotes: [
      { _id: oid('qq07000000000000000001'), quote: 'The surveillance state did not need to be imposed. We bought the cameras, installed them in our homes, and carry them in our pockets.' },
      { _id: oid('qq07000000000000000002'), quote: 'The dystopia is opt-in.' },
    ],
    groupId: null,
    enable_voting: true,
  },

  // 8. Cryptocurrency Regulation
  {
    _id: oid('66117b8c9d0e1f2a3b4c5d6e'),
    userId: userIds.newsHound,
    created: daysAgo(12),
    title: 'Crypto Needs Regulation — And That Is Not a Controversial Take',
    text: 'The collapse of FTX, Terra/Luna, and dozens of smaller exchanges proved what regulators warned about for years: an unregulated financial system will produce fraud at scale. Reasonable regulation does not mean banning crypto — it means requiring exchanges to prove their reserves, mandating disclosure of conflicts of interest, and treating stablecoins like the money market funds they effectively are. The crypto community is split between idealists who want decentralization and speculators who just want number-go-up. Good regulation protects the former from the latter.',
    url: '/dashboard/post/general/crypto-needs-regulation/66117b8c9d0e1f2a3b4c5d6e',
    citationUrl: 'https://www.ft.com/crypto-regulation',
    approvedBy: [
      userIds.alex, userIds.techguru, userIds.civicMind, userIds.sarahJ,
      userIds.reader01, userIds.reader02,
    ],
    rejectedBy: [userIds.codeMaster, userIds.reader03, userIds.reader04, userIds.reader05],
    bookmarkedBy: [userIds.newsHound, userIds.civicMind],
    creator: {
      _id: userIds.newsHound,
      username: 'news_hound',
      name: 'Derek Fowler',
      avatar: undefined,
    },
    comments: [
      {
        _id: oid('cc08aa000000000000000001'),
        created: daysAgo(12),
        userId: userIds.codeMaster,
        content: 'I disagree with some of this. The problem is not lack of regulation — it is that existing fraud laws were not enforced. SBF broke laws that already existed.',
        user: { _id: userIds.codeMaster, username: 'code_master', name: 'Lena Kowalski' },
      },
      {
        _id: oid('cc08aa000000000000000002'),
        created: daysAgo(11),
        userId: userIds.techguru,
        content: 'Both things can be true. We need enforcement AND clearer rules. Right now the SEC regulates by lawsuit.',
        user: { _id: userIds.techguru, username: 'techguru', name: 'Marcus Chen' },
      },
      {
        _id: oid('cc08aa000000000000000003'),
        created: daysAgo(11),
        userId: userIds.civicMind,
        content: 'The stablecoin-as-money-market-fund analogy is perfect. That alone would prevent a lot of the damage we have seen.',
        user: { _id: userIds.civicMind, username: 'civic_mind', name: 'Jordan Osei' },
      },
      {
        _id: oid('cc08aa000000000000000004'),
        created: daysAgo(10),
        userId: userIds.reader01,
        content: 'Good regulation protects the former from the latter — this is the best one-line summary of what crypto regulation should aim for.',
        user: { _id: userIds.reader01, username: 'reader01', name: 'Chris Taylor' },
      },
    ],
    votes: [
      { _id: oid('vv08000000000000000001'), type: 'UP', startWordIndex: 0, endWordIndex: 10 },
      { _id: oid('vv08000000000000000002'), type: 'DOWN', startWordIndex: 20, endWordIndex: 35 },
      { _id: oid('vv08000000000000000003'), type: 'UP', startWordIndex: 60, endWordIndex: 80 },
      { _id: oid('vv08000000000000000004'), type: 'UP', startWordIndex: 80, endWordIndex: 90 },
      { _id: oid('vv08000000000000000005'), type: 'DOWN', startWordIndex: 35, endWordIndex: 50 },
    ],
    quotes: [
      { _id: oid('qq08000000000000000001'), quote: 'Good regulation protects the former from the latter.' },
    ],
    groupId: mockGroupId,
    enable_voting: true,
  },
]
