"use client"

import { ContentList, ContentItemData } from '@/components/ContentList'

const mockData: ContentItemData[] = [
    {
        _id: '1',
        title: 'Understanding React Server Components',
        text: 'React Server Components allow you to write UI that can be rendered on the server. This reduces the amount of JavaScript sent to the client and improves performance. They are a game changer for building modern web applications.',
        upvotes: 120,
        downvotes: 5,
        url: '/post/react-server-components',
        createdAt: '2023-10-01T10:00:00Z'
    },
    {
        _id: '2',
        title: 'Why Tailwind CSS is Awesome',
        text: 'Tailwind CSS provides low-level utility classes that let you build completely custom designs without ever leaving your HTML. It is highly customizable and scales well.',
        upvotes: 85,
        downvotes: 2,
        url: '/post/tailwind-css-awesome',
        createdAt: '2023-10-02T14:30:00Z'
    },
    {
        _id: '3',
        title: 'Javascript vs Python for Web Dev',
        text: 'Both Javascript and Python are excellent languages for web development. Javascript is essential for frontend, while Python (Django/Flask) is great for backend. Node.js allows Javascript on the backend too.',
        upvotes: 200,
        downvotes: 15,
        url: '/post/js-vs-python',
        createdAt: '2023-09-28T09:15:00Z'
    },
    {
        _id: '4',
        title: 'The Future of AI in Coding',
        text: 'AI tools like Copilot and ChatGPT are changing how we write code. They help with boilerplate, debugging, and even complex logic. However, human oversight is still crucial.',
        upvotes: 350,
        downvotes: 10,
        url: '/post/ai-coding-future',
        createdAt: '2023-11-15T11:00:00Z'
    },
    {
        _id: '5',
        title: 'Effect of Sleep on Productivity',
        text: 'Getting 8 hours of sleep is vital for cognitive function. Lack of sleep leads to burnout and more bugs in code.',
        upvotes: 45,
        downvotes: 0,
        url: '/post/sleep-productivity',
        createdAt: '2023-08-20T22:00:00Z'
    },
    {
        _id: '6',
        title: 'A Guide to Docker',
        text: 'Docker simplifies deployment by packaging applications into containers. This ensures consistency across different environments.',
        upvotes: 90,
        downvotes: 3,
        url: '/post/docker-guide',
        createdAt: '2023-10-05T16:45:00Z'
    }
]

export default function ContentListTestPage() {
    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8 text-center">ContentList Component Test</h1>
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg border">
                <ContentList items={mockData} itemsPerPage={3} />
            </div>
        </div>
    )
}
