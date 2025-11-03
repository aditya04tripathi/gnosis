# Startup Validator SaaS

An AI-powered startup idea validation platform built with Next.js 16, featuring comprehensive validation, project planning, flowcharts, and task management boards.

## Features

- 🤖 **AI-Powered Validation**: Validate startup ideas using Groq's LLM with detailed feedback
- 📊 **Project Planning**: Generate comprehensive project plans with phases, tasks, and timelines
- 📈 **Flowcharts**: Interactive visual flowcharts using xyflow to visualize project workflows
- 📋 **SCRUM Boards**: Toggleable task management boards for project execution
- 💰 **Subscription Plans**: Free (5 searches), Basic, Pro with monthly or yearly billing options
- 🔐 **Authentication**: Secure JWT-based authentication with NextAuth
- ⚡ **Rate Limiting**: Built-in rate limiting with Redis
- 💾 **Caching**: Redis caching for improved performance
- 🎨 **Modern UI**: Built with Shadcn UI, Tailark, and MagicUI components

## Tech Stack

- **Framework**: Next.js 16
- **UI**: Shadcn UI, Tailark, MagicUI
- **Database**: MongoDB with Mongoose
- **Caching**: Redis (ioredis)
- **Authentication**: NextAuth.js v5 (JWT)
- **AI**: Groq SDK
- **Payments**: PayPal
- **Visualization**: @xyflow/react (React Flow)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- MongoDB instance
- Redis instance
- Groq API key

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd saas-help-ai
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:
   Create a `.env.local` file with the following:

```env
# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/startup-validator

# Redis
REDIS_URL=redis://localhost:6379

# Groq AI
GROQ_API_KEY=your-groq-api-key-here

# PayPal (for production)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox
```

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── validate/          # Validation page
│   ├── validation/        # Validation results
│   ├── project/           # Project detail pages
│   └── pricing/           # Pricing page
├── actions/               # Server actions
│   ├── auth.ts           # Authentication actions
│   ├── validation.ts     # Validation actions
│   └── payment.ts        # Payment actions
├── components/           # React components
│   ├── ui/              # Shadcn UI components
│   ├── project-flowchart.tsx
│   ├── project-boards.tsx
│   └── pricing-cards.tsx
├── constants/           # Application constants
├── lib/                 # Utility libraries
│   ├── db.ts           # MongoDB connection
│   ├── redis.ts       # Redis client
│   └── groq.ts        # Groq AI integration
├── models/             # Mongoose models
│   ├── User.ts
│   ├── Validation.ts
│   └── ProjectPlan.ts
└── types/              # TypeScript types
    ├── auth.types.ts
    ├── validation.types.ts
    └── payment.types.ts
```

## Features Details

### AI Validation

- Users submit their startup idea
- Groq LLM analyzes the idea and provides:
  - Validation score (0-100)
  - Detailed feedback
  - Strengths and weaknesses
  - Actionable suggestions
  - Market analysis
  - Competition analysis
  - Target audience insights
  - Recommended billing period (monthly or yearly)

### Project Planning

- Automatic generation of project plans with:
  - Multiple phases (Research, MVP, Testing, Launch, etc.)
  - Tasks for each phase
  - Dependencies between phases
  - Estimated duration and cost
  - Risk assessment

### Flowcharts

- Interactive flowcharts showing:
  - Project phases
  - Dependencies between phases
  - Visual workflow representation
  - Drag-and-drop capability

### SCRUM Boards

- SCRUM: Sprint-based view with TODO, IN_PROGRESS, DONE columns
- Task management:
  - Update task status
  - Priority levels
  - Tags
  - Phase assignment

### Subscription Plans

- **Free**: 5 validations, basic project plans, flowcharts
- **Monthly ($29/month)**: 50 validations/month, all features
- **Yearly ($299/year)**: 600 validations/year, all features, 20% savings
- **One-Time ($49)**: Unlimited validations, lifetime access

## Environment Variables

| Variable               | Description                         | Required                        |
| ---------------------- | ----------------------------------- | ------------------------------- |
| `NEXTAUTH_SECRET`      | Secret key for NextAuth JWT signing | Yes                             |
| `NEXTAUTH_URL`         | Base URL of your application        | Yes                             |
| `MONGODB_URI`          | MongoDB connection string           | Yes                             |
| `REDIS_URL`            | Redis connection string             | No (optional, disables caching) |
| `GROQ_API_KEY`         | Groq API key for LLM                | Yes                             |
| `PAYPAL_CLIENT_ID`     | PayPal client ID                    | Yes (for payments)              |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret                | Yes (for payments)              |
| `PAYPAL_MODE`          | PayPal mode (sandbox/live)          | Yes                             |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy

### Railway Deployment

1. **Create a Railway project:**
   - Go to [railway.app](https://railway.app) and create a new project
   - Connect your GitHub repository
   - Railway will auto-detect it's a Next.js app

2. **Add MongoDB service:**
   - In your Railway project, click "New" → "Database" → "MongoDB"
   - Railway will automatically provide `MONGODB_URI` environment variable

3. **Add Redis service (optional):**
   - Click "New" → "Database" → "Redis"  
   - Railway will automatically provide `REDIS_URL` environment variable
   - The app works without Redis, but caching will be disabled

4. **Set environment variables:**
   - Go to your main service → "Variables" tab
   - Add the following required variables:
     ```bash
     NEXTAUTH_SECRET=your-secret-key-here
     NEXTAUTH_URL=https://your-app.up.railway.app
     GROQ_API_KEY=your-groq-api-key-here
     PAYPAL_CLIENT_ID=your-paypal-client-id
     PAYPAL_CLIENT_SECRET=your-paypal-client-secret
     PAYPAL_MODE=sandbox  # Use 'sandbox' for testing, 'live' for production
     ```
   - Generate `NEXTAUTH_SECRET` using: `openssl rand -base64 32`
   - **Important**: Update `NEXTAUTH_URL` after first deployment with your actual Railway domain

5. **Link MongoDB to your service:**
   - In your main service variables, link `MONGODB_URI` from the MongoDB service
   - Railway should auto-link this, but verify it's set

6. **Deploy:**
   - Railway will automatically deploy when you push to your main branch
   - Monitor deployment logs in Railway dashboard

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- AWS
- Digital Ocean

Make sure to:

- Set up MongoDB (MongoDB Atlas recommended)
- Set up Redis (Redis Cloud or Upstash recommended)
- Configure environment variables
- Set up PayPal webhooks for payment processing

## Development

### Run Linter

```bash
pnpm lint
```

### Format Code

```bash
pnpm format
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
