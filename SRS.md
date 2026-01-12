# Software Requirements Specification (SRS) for Gnosis

## 1. Introduction

### 1.1 Purpose

This document defines the software requirements for Gnosis, an AI-powered startup validation platform. The system enables entrepreneurs to validate business ideas using artificial intelligence, generate comprehensive project plans, visualize workflows, and manage task execution through SCRUM boards.

### 1.2 Scope

The system provides a web-based interface for:

- AI-driven startup idea validation and feedback analysis
- Automated project planning with phase-based execution plans
- Interactive flowchart visualization of project phases and dependencies
- Task management using SCRUM-style Kanban boards
- User authentication and profile management
- Usage tracking and rate limiting

The system operates as a free-tier service with usage limits enforced per user account.

## 2. Overall Description

### 2.1 System Context

Gnosis is a standalone web application that integrates with external AI providers (Groq) for intelligent analysis and uses MongoDB for persistent storage of user data, validation history, project plans, and task states.

### 2.2 User Types

- **Guest**: A visitor who can view public landing pages (Home, About, Privacy, Terms, Pricing)
- **Registered User**: An authenticated user with access to free tier features including:
  - 1 AI validation per 2 days
  - Basic project plan generation
  - Flowchart visualization
  - SCRUM board task management

### 2.3 Operating Environment

- **Client**: Modern web browsers (Chrome, Firefox, Safari, Edge) on desktop and mobile devices
- **Server**: Next.js 16 runtime environment (Node.js 22+)
- **Database**: MongoDB v6.0+ (local or cloud instance)
- **AI Provider**: Groq API for LLM processing

## 3. Functional Requirements

### 3.1 Authentication and Authorization

- **Req-3.1.1**: The system shall allow users to sign up using email and password credentials
- **Req-3.1.2**: The system shall allow users to sign in using email and password
- **Req-3.1.3**: The system shall maintain user sessions securely using NextAuth.js session management
- **Req-3.1.4**: The system shall restrict access to core features (Validation, Dashboard, Project Management) to authenticated users only
- **Req-3.1.5**: The system shall redirect unauthenticated users to the sign-in page when accessing protected routes

### 3.2 AI Idea Validation

- **Req-3.2.1**: The system shall provide a form interface for users to input their startup idea details (minimum 10 characters)
- **Req-3.2.2**: The system shall interact with the Groq AI API to analyze the input idea
- **Req-3.2.3**: The system shall generate and display a validation report containing:
  - Validation score (0-100)
  - Detailed feedback (2-3 paragraphs)
  - Strengths analysis (3-5 items)
  - Weaknesses analysis (3-5 items)
  - Actionable suggestions (5-7 items)
  - Market analysis (2-3 paragraphs)
  - Competition analysis
  - Target audience identification
- **Req-3.2.4**: The system shall save validation reports to the user's validation history
- **Req-3.2.5**: The system shall enforce a limit of 1 validation per 2 days for free tier users
- **Req-3.2.6**: The system shall reset usage counters after the 2-day period expires

### 3.3 Project Planning

- **Req-3.3.1**: The system shall automatically generate a project execution plan based on a validated idea
- **Req-3.3.2**: The generated plan shall include distinct phases (e.g., Research, MVP, Testing, Launch)
- **Req-3.3.3**: Each phase shall contain multiple tasks with:
  - Task title and description
  - Priority level
  - Status (TODO, IN_PROGRESS, DONE, BLOCKED)
  - Dependencies on other tasks
- **Req-3.3.4**: The system shall estimate duration and cost for each phase
- **Req-3.3.5**: The system shall identify risk levels for the overall project
- **Req-3.3.6**: The system shall generate alternative startup ideas based on the original validation

### 3.4 Interactive Flowcharts

- **Req-3.4.1**: The system shall visualize the project plan as an interactive node-based flowchart using @xyflow/react
- **Req-3.4.2**: Users shall be able to view dependencies and workflow steps visually
- **Req-3.4.3**: The flowchart component shall support pan, zoom, and standard navigation controls
- **Req-3.4.4**: The flowchart state shall be persisted per project plan

### 3.5 Task Management (SCRUM Boards)

- **Req-3.5.1**: The system shall provide a Kanban/SCRUM board interface for project tasks
- **Req-3.5.2**: Users shall be able to move tasks between status columns (TODO, IN_PROGRESS, DONE, BLOCKED)
- **Req-3.5.3**: The system shall persist task status changes to the database
- **Req-3.5.4**: Task status updates shall be synchronized between the flowchart view and SCRUM board view

### 3.6 User Profile Management

- **Req-3.6.1**: The system shall allow users to view and update their profile information (name, email)
- **Req-3.6.2**: The system shall allow users to manage AI provider preferences (Gemini, OpenAI, Anthropic)
- **Req-3.6.3**: The system shall allow users to configure API keys for preferred AI providers
- **Req-3.6.4**: The system shall allow users to manage notification preferences
- **Req-3.6.5**: The system shall allow users to change their password
- **Req-3.6.6**: The system shall allow users to delete their account and all associated data

### 3.7 Usage Tracking

- **Req-3.7.1**: The system shall track the number of validations used by each user
- **Req-3.7.2**: The system shall display remaining validations available to the user
- **Req-3.7.3**: The system shall display the reset date for usage limits
- **Req-3.7.4**: The system shall prevent validation requests when the usage limit is reached

## 4. Non-Functional Requirements

### 4.1 Performance

- **NFR-4.1.1**: The application shall load the initial dashboard within 2 seconds on 4G networks
- **NFR-4.1.2**: AI validation responses shall be displayed within 15 seconds of submission under normal conditions
- **NFR-4.1.3**: Project plan generation shall complete within 20 seconds of request

### 4.2 Security

- **NFR-4.2.1**: All data transmission shall be encrypted via TLS 1.2+
- **NFR-4.2.2**: User passwords shall be hashed using bcrypt before storage
- **NFR-4.2.3**: API keys (Groq, MongoDB) shall be stored in server-side environment variables and never exposed to the client
- **NFR-4.2.4**: User API keys (for AI providers) shall be stored securely and encrypted at rest
- **NFR-4.2.5**: Session tokens shall be securely managed by NextAuth.js

### 4.3 Reliability

- **NFR-4.3.1**: The system shall handle AI API failures gracefully by notifying the user and allowing retries
- **NFR-4.3.2**: The system shall handle database connection failures with appropriate error messages
- **NFR-4.3.3**: The system shall implement rate limiting to prevent abuse (10 validations per hour per user)

### 4.4 Usability

- **NFR-4.4.1**: The user interface shall be responsive and functional on mobile (320px+) and desktop (1024px+) viewports
- **NFR-4.4.2**: The system shall provide clear error messages for validation failures
- **NFR-4.4.3**: The system shall support dark and light themes

### 4.5 Maintainability

- **NFR-4.5.1**: The code shall adhere to a modular architecture separating Auth, Validation, Project, Dashboard, and Shared modules
- **NFR-4.5.2**: Types shall be strictly enforced using TypeScript
- **NFR-4.5.3**: Code shall follow consistent formatting standards (Biome)

## 5. System Constraints

- **CON-5.1**: The system must be deployed on a platform supporting Next.js Server Actions and Node.js runtime (e.g., Vercel, Railway)
- **CON-5.2**: Database schema changes must be managed via Mongoose models
- **CON-5.3**: The system requires Node.js 22+ runtime environment
- **CON-5.4**: The system requires MongoDB v6.0+ for database operations
- **CON-5.5**: The system requires a valid Groq API key for AI functionality

## 6. External Interface Requirements

### 6.1 AI Provider Interface

- **EIR-6.1**: The system shall interface with the Groq API for Large Language Model processing
- **EIR-6.2**: The system shall handle Groq API responses and parse JSON validation results
- **EIR-6.3**: The system shall handle Groq API errors and rate limits appropriately

### 6.2 Database Interface

- **EIR-6.3**: The system shall interface with a MongoDB database for persistence of:
  - User accounts and authentication data
  - Validation history and results
  - Project plans and task states
  - SCRUM board configurations

### 6.3 User Interface

- **EIR-6.4**: The system shall provide a web-based user interface accessible via modern browsers
- **EIR-6.5**: The system shall support server-side rendering (SSR) and client-side interactivity

## 7. Assumptions and Dependencies

### 7.1 Assumptions

- **ASM-7.1**: It is assumed users have a stable internet connection
- **ASM-7.2**: It is assumed users have access to a modern web browser
- **ASM-7.3**: It is assumed users understand basic startup terminology and concepts

### 7.2 Dependencies

- **DEP-7.1**: The system depends on the availability of the Groq API service
- **DEP-7.2**: The system depends on `@xyflow/react` for flowchart rendering
- **DEP-7.3**: The system depends on NextAuth.js for authentication
- **DEP-7.4**: The system depends on Mongoose for MongoDB operations
- **DEP-7.5**: The system depends on Next.js 16 framework

## 8. Acceptance Criteria

- **AC-8.1**: A new user can sign up, validate an idea, and view the generated project plan and flowchart without errors
- **AC-8.2**: The UI is responsive and functions correctly on mobile (320px+) and desktop (1024px+) viewports
- **AC-8.3**: Non-authenticated users are redirected to the login page when accessing protected routes
- **AC-8.4**: Users cannot exceed the free tier limit of 1 validation per 2 days
- **AC-8.5**: Validation reports contain all required fields (score, feedback, strengths, weaknesses, suggestions, market analysis)
- **AC-8.6**: Project plans are generated with phases, tasks, dependencies, and estimates
- **AC-8.7**: Task status changes persist across page refreshes
- **AC-8.8**: Users can successfully delete their account and all associated data
