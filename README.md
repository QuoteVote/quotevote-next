# Quote.Vote Next

> An open-source, text-only social platform for thoughtful dialogue. Every post creates its own chatroom where people can quote, vote, and respond in real time.

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Open Collective](https://img.shields.io/badge/Open%20Collective-Support-blue.svg)](https://opencollective.com/quotevote/donate)

Quote.Vote fosters deliberative, ad-free conversations for communities and civic collaboration. Built with modern web technologies including Next.js 16, React 19, TypeScript, GraphQL, and Tailwind CSS.

## 🚀 Features

- **Real-time Conversations**: Each post creates its own chatroom for instant dialogue
- **Quote & Vote System**: Engage with content through quoting and voting mechanisms
- **Text-Only Platform**: Focus on thoughtful dialogue without distractions
- **Modern Tech Stack**: Built with Next.js 16, React 19, and TypeScript
- **Type-Safe**: Full TypeScript implementation for both frontend and backend
- **Ad-Free**: Clean, focused experience for meaningful discussions

## 🏗️ Project Structure

This is a monorepo containing the complete Quote.Vote application:

```
quotevote-next/
├── quotevote-frontend/    # Next.js 16 frontend application
├── quotevote-backend/     # Express + TypeScript backend API
└── docs/                  # Migration and project documentation
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS 4.x
- **Components**: shadcn/ui
- **State Management**: Zustand
- **GraphQL Client**: Apollo Client

### Backend
- **Runtime**: Node.js 20.x+
- **Framework**: Express 5.2.1
- **Language**: TypeScript (Strict Mode)
- **GraphQL**: Apollo Server
- **Database**: MongoDB with Mongoose

## 🎨 Design Resources

- **[UI Design Inspiration (Figma)](https://www.figma.com/design/b4zMmypvTj7R9HgcWUwGHM/Quote.Vote-User-Interface-Design)**
- **[UI Design Specifications (Zeplin)](https://zpl.io/VDlzXPg)**

## 📋 Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: Latest version (install with `npm install -g pnpm`)
- **MongoDB**: Local instance or connection string (for backend)

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/QuoteVote/quotevote-next.git
cd quotevote-next
```

### Frontend Setup

```bash
cd quotevote-frontend
pnpm install
pnpm dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

For detailed frontend documentation, see the [Frontend README](./quotevote-frontend/README.md).

### Backend Setup

```bash
cd quotevote-backend
pnpm install
pnpm dev
```

The backend will be available at [http://localhost:4000](http://localhost:4000).

For detailed backend documentation, see the [Backend README](./quotevote-backend/README.md).

## 📚 Documentation

- **[Frontend Documentation](./quotevote-frontend/README.md)** - Complete guide for the Next.js frontend
- **[Backend Documentation](./quotevote-backend/README.md)** - Complete guide for the Express backend
- **[Migration Rules](./docs/Migration-Rules.md)** - Detailed migration guidelines and best practices

## 🔄 Legacy Codebase

This project is a complete migration from the legacy codebase:

- **[Legacy Quotevote Repo](https://github.com/QuoteVote/quotevote-monorepo)** - Monorepo containing both frontend and backend code
- **[Legacy Frontend](https://github.com/QuoteVote/quotevote-monorepo/tree/main/client)** - Original React 17/Vite codebase
- **[Legacy Backend](https://github.com/QuoteVote/quotevote-monorepo/tree/main/server)** - Original JavaScript/Babel/Express 4 codebase

## 🤝 Contributing

We welcome contributions! Please ensure:

- All tests pass
- TypeScript compiles without errors
- Code follows the project's style guidelines
- Documentation is updated as needed

For detailed contribution guidelines, see the individual README files in the frontend and backend directories.

## 💰 Support

Quote.Vote is an open-source project. If you find it valuable, please consider supporting us:

**[Donate via Open Collective](https://opencollective.com/quotevote/donate)**

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](./LICENSE) file for details.

---

**Built with ❤️ by the Quote.Vote community**
