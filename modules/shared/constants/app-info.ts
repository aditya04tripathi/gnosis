export const APP_INFO = {
  name: "Gnosis",
  fullName: "Gnosis — Startup validation with clarity",
  tagline: "Know before you build",
  description:
    "Gnosis turns raw startup ideas into scored validation, market insight, and execution plans you can actually ship against.",
  shortDescription:
    "Validate startup ideas, generate project plans, and manage execution in one place.",
  keywords: [
    "startup",
    "validation",
    "AI",
    "business ideas",
    "entrepreneurship",
    "startup validator",
    "idea validation",
    "project planning",
    "startup analysis",
  ],
  author: {
    name: "Aditya Tripathi",
    url: "https://gnosis.adityatripathi.dev",
  },
} as const;

export const HERO_SECTION = {
  heading: "Know the idea before you build it",
  subheading:
    "Score market fit, surface risk early, and leave with a plan your team can execute.",
  cta: {
    primary: {
      text: "Start validating",
      href: "/auth/signup",
    },
    secondary: {
      text: "See how it works",
      href: "#features",
    },
  },
} as const;

export const FEATURES = {
  heading: "From gut feeling to grounded plan",
  description:
    "Validation, planning, and delivery tools that stay in one workspace instead of five tabs.",
  items: [
    {
      title: "AI validation",
      description:
        "Scored analysis with strengths, gaps, market signals, and concrete next moves — not a vague pep talk.",
      icon: "brain",
    },
    {
      title: "Living flowcharts",
      description:
        "Phases, dependencies, and decision points laid out so scope stops living only in someone’s head.",
      icon: "gitBranch",
    },
    {
      title: "SCRUM boards",
      description:
        "Drag work from idea to done. Keep founders and builders aligned without another tool migration.",
      icon: "layoutGrid",
    },
    {
      title: "Project planning",
      description:
        "Phased plans with timelines and risk notes you can regenerate as the idea sharpens.",
      icon: "sparkle",
    },
  ],
} as const;

export const AUTH = {
  signIn: {
    title: "Sign In to Gnosis",
    subtitle: "Welcome back! Sign in to continue",
    buttonText: "Sign In",
    buttonLoadingText: "Signing in...",
  },
  signUp: {
    title: "Create a Gnosis Account",
    subtitle:
      "Welcome! Create an account to get started with 1 free validation per 2 days",
    buttonText: "Sign Up",
    buttonLoadingText: "Creating account...",
    passwordHint: "Must be at least 8 characters",
  },
  orText: "Or continue With",
} as const;

export const VALIDATE = {
  heading: "Validate Your Startup Idea",
  description:
    "Describe your startup idea and get AI-powered validation with detailed feedback",
  placeholder:
    "Describe your startup idea in detail. Include what problem you're solving, your target audience, and how your solution works...",
  buttonText: "Validate Idea",
  buttonLoadingText: "Validating...",
  minLength: 10,
  maxLength: 1000,
  errorMessages: {
    tooShort: "Please provide a detailed startup idea (at least 10 characters)",
    rateLimit: "Rate limit exceeded. Please try again later.",
    upgradeRequired: "Free plan limit reached",
    subscriptionLimit: "Subscription limit reached",
    unauthorized: "Unauthorized",
  },
} as const;

export const DASHBOARD = {
  title: "Dashboard",
  description: "View and manage your startup idea validations",
  emptyState: {
    title: "No validations yet",
    description: "Start validating your startup ideas",
    cta: "Create First Validation",
  },
  stats: {
    searchesRemaining: "Searches Remaining",
    totalValidations: "Total Validations",
    subscription: "Subscription",
    ofFreeSearches: (limit: number) =>
      `of ${limit} free search${limit !== 1 ? "es" : ""} per 2 days`,
    ofMonthlySearches: (limit: number | string) =>
      typeof limit === "number" && limit === Infinity
        ? "unlimited monthly searches"
        : `of ${limit} monthly searches`,
    allTimeValidations: "All time validations",
    upgradeText: "Upgrade to unlock more",
  },
  newValidation: "New Validation",
} as const;

export const FOOTER = {
  copyright: (year: number) =>
    `© ${year} ${APP_INFO.name}, All rights reserved`,
  links: [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Validate", href: "/validate" },
    { title: "Pricing", href: "/pricing" },
    { title: "About", href: "/about" },
    { title: "Profile", href: "/profile" },
    { title: "Privacy", href: "/privacy" },
    { title: "Terms", href: "/terms" },
  ],
} as const;

export const METADATA = {
  default: {
    title: `${APP_INFO.fullName}`,
    template: `%s | ${APP_INFO.name}`,
    description: APP_INFO.description,
    keywords: [...APP_INFO.keywords],
    authors: [{ name: APP_INFO.author.name, url: APP_INFO.author.url }],
    openGraph: {
      type: "website" as const,
      locale: "en_US",
      siteName: APP_INFO.name,
      title: APP_INFO.fullName,
      description: APP_INFO.shortDescription,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: APP_INFO.fullName,
      description: APP_INFO.shortDescription,
    },
  },
  pages: {
    signIn: {
      title: `Sign In | ${APP_INFO.name}`,
      description: `Sign in to your ${APP_INFO.name} account to validate your startup ideas`,
    },
    signUp: {
      title: `Sign Up | ${APP_INFO.name}`,
      description: `Create a ${APP_INFO.name} account to start validating your startup ideas`,
    },
    dashboard: {
      title: `Dashboard | ${APP_INFO.name}`,
      description: "View and manage your startup idea validations",
    },
    privacy: {
      title: `Privacy Policy | ${APP_INFO.name}`,
      description: `Privacy Policy for ${APP_INFO.name}. Learn how I collect, use, and protect your personal data.`,
    },
    terms: {
      title: `Terms and Conditions | ${APP_INFO.name}`,
      description: `Terms and Conditions for ${APP_INFO.name}. Read my terms of service and usage agreement.`,
    },
    about: {
      title: `About | ${APP_INFO.name}`,
      description: `Learn about ${APP_INFO.name}, my mission, vision, and the meaning behind my name.`,
    },
  },
};

export const TESTIMONIALS = {
  heading: "Founders who stress-tested the idea first",
  description:
    "Clearer pivots, tighter roadmaps, fewer months spent building the wrong thing.",
} as const;

export const CONTACT = {
  support: {
    email: "support@gnosis.app",
    description: "Contact me through my support channels",
  },
} as const;

export const LEGAL = {
  terms: {
    serviceName: APP_INFO.name,
    lastUpdated: (date: string) => `Last updated: ${date}`,
  },
  privacy: {
    companyName: APP_INFO.name,
    lastUpdated: (date: string) => `Last updated: ${date}`,
  },
} as const;

export const ABOUT = {
  gnosis: {
    meaning:
      "Gnosis (γνῶσις) is an ancient Greek word meaning 'knowledge' or 'insight'—particularly knowledge gained through direct experience and understanding, rather than just theoretical learning. In my context, Gnosis represents the deep, actionable knowledge that entrepreneurs gain when they truly understand their startup idea's potential, market fit, and path to success.",
    origin:
      "Derived from the Greek verb 'gignōskō' (to know), Gnosis embodies the transformative power of knowledge that comes from validation, analysis, and genuine insight into what makes a startup idea viable.",
  },
  vision: {
    title: "My Vision",
    content:
      "To empower every entrepreneur with the knowledge and insights needed to transform their startup ideas into successful businesses. I envision a world where no great idea goes unvalidated, and every entrepreneur has access to the tools and knowledge to make informed decisions about their venture.",
  },
  mission: {
    title: "My Mission",
    content:
      "To democratize startup validation by providing AI-powered, accessible, and comprehensive analysis tools that help entrepreneurs understand their ideas' potential. I strive to bridge the gap between having an idea and having a validated, actionable plan by offering deep insights into market potential, competition, feasibility, and execution strategies—making the path to startup success clearer and more achievable for everyone.",
  },
  why: {
    title: "Why I Built Gnosis",
    content:
      "Starting a business is challenging, and many great ideas fail not because they're bad ideas, but because entrepreneurs lack the resources and insights to validate and refine them before investing significant time and money. Traditional validation methods are expensive, time-consuming, and often inaccessible to early-stage founders. I built Gnosis to change that. By leveraging AI technology, I've created an affordable, accessible platform that provides comprehensive startup validation and planning—giving every entrepreneur the knowledge (gnosis) they need to succeed. My goal is to help founders make informed decisions, reduce risk, and increase their chances of building something truly impactful.",
  },
} as const;
