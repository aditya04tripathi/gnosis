# Gnosis - AI-Powered Startup Validation

**Gnosis** is an AI-powered platform designed to help entrepreneurs validate their startup ideas, generate comprehensive project plans, and manage execution through interactive workflows and SCRUM boards.

## Overview

Gnosis leverages Groq's Large Language Model (LLM) capabilities to provide detailed market analysis, feasibility checks, and actionable feedback for startup ideas. The platform combines validation tools, project planning, and task management into a single, cohesive interface.

The name "Gnosis" (γνῶσις) is an ancient Greek word meaning "knowledge" or "insight"—particularly knowledge gained through direct experience and understanding. In this context, Gnosis represents the deep, actionable knowledge that entrepreneurs gain when they truly understand their startup idea's potential, market fit, and path to success.

## Key Features

- **AI-Powered Validation**: Instant analysis of startup ideas with scoring (0-100), SWOT analysis, and market insights
- **Automated Project Planning**: Generation of phased execution plans (Research, MVP, Testing, Launch) with cost and time estimates
- **Interactive Flowcharts**: Visual representation of project phases and dependencies using @xyflow/react
- **SCRUM Boards**: Built-in task management boards for tracking progress (TODO, In Progress, Done, Blocked)
- **Secure Authentication**: Robust user management via NextAuth.js
- **Free Tier Access**: 1 AI validation per 2 days for all registered users

## Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Shadcn UI
- **Database**: MongoDB (via Mongoose)
- **Authentication**: NextAuth.js v5 (Beta)
- **AI Provider**: Groq SDK
- **Visualization**: @xyflow/react
- **Package Manager**: pnpm

## Architecture Overview

The application follows a modular architecture to ensure scalability and maintainability:

- **`app/`**: Next.js App Router entry points and pages
  - `(app)/`: Protected application routes (dashboard, validation, projects)
  - `(auth)/`: Authentication pages (sign in, sign up)
  - `(default)/`: Public pages (home, about, privacy, terms, pricing)
- **`modules/`**: Feature-based modules containing domain logic, components, and types
  - `auth/`: Authentication and user management
  - `validation/`: Idea validation and AI integration
  - `project/`: Project planning and management
  - `dashboard/`: Dashboard components and data tables
  - `profile/`: User profile and settings management
  - `shared/`: Shared utilities, components, models, and constants
- **`components/ui/`**: Reusable low-level UI components (Shadcn)

## Setup and Installation

### Prerequisites

- Node.js 22+
- pnpm
- MongoDB (local install, Atlas, or any reachable instance)
- Groq API Key ([Get one here](https://console.groq.com/))

### Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd saas-help-ai
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure Environment**

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local — set MONGODB_URI to your MongoDB instance
   openssl rand -base64 32
   ```

   Point `MONGODB_URI` at an external MongoDB (local daemon, Atlas, etc.).
   Local AI via Ollama is optional (`AI_PROVIDER=ollama`); production typically uses Groq (`GROQ_API_KEY`).

4. **Run the app**

   ```bash
   pnpm dev
   ```

   App: **http://localhost:3000**

## Usage

1. **Sign Up**: Create an account to access the platform
2. **Validate Idea**: Navigate to "Validate" to submit your startup idea (minimum 10 characters)
3. **View Results**: Review the AI-generated validation report with score, feedback, strengths, weaknesses, and suggestions
4. **Generate Plan**: Create a comprehensive project plan with phases, tasks, and estimates
5. **Visualize**: Explore the interactive flowchart showing project phases and dependencies
6. **Manage Tasks**: Use the SCRUM board to track task progress and update statuses
7. **Dashboard**: Monitor your validation history and usage statistics

## Configuration

Configuration is primarily handled through environment variables:

- **NextAuth**: Configured in `modules/shared/lib/auth.ts`
- **Database**: Connection settings in `modules/shared/lib/db.ts`
- **AI Provider**: Groq client configuration in `modules/shared/lib/groq.ts`
- **Tailwind**: Configured in `app/globals.css` (v4 CSS-first config)

## Deployment

Production runs on [Railway](https://railway.app) via Railpack (`railway.toml`).

1. Connect this repo to a Railway project.
2. Add Railway's MongoDB plugin and set `MONGODB_URI=${{MongoDB.MONGO_URL}}`.
3. Copy variables from `.env.example` into Railway service variables.
4. Set `NEXT_PUBLIC_API_URL` as a build-time variable.
5. Point your custom domain (or use the Railway-generated URL) in `NEXTAUTH_URL`, `AUTH_URL`, and `NEXT_PUBLIC_API_URL`.

## Limitations and Assumptions

- **Usage Limits**: Free tier users are limited to 1 AI validation per 2 days
- **AI Dependency**: AI analysis depends on the availability and limits of the Groq API
- **Rate Limiting**: The system enforces rate limits (10 validations per hour per user) to prevent abuse
- **Browser Support**: Requires modern web browsers with JavaScript enabled

## Documentation

- [Software Requirements Specification](./SRS.md)

## License

This project is licensed under the terms described in [LICENSE](./LICENSE).

## Author

**Aditya Tripathi**

- Website: [https://gnosis.adityatripathi.dev](https://gnosis.adityatripathi.dev)
- GitHub: [@aditya04tripathi](https://github.com/aditya04tripathi)
