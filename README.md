# Health & Wellness Agent Platform with Mastra

This project implements a personalized AI health and wellness assistant using Mastra's workflows and agent capabilities. It features a modern Next.js frontend with Supabase authentication, creating an interactive, user-specific health coaching system that allows users to share their health information, receive personalized wellness plans, and track their progress toward health goals.

## 🏗️ Architecture

The application combines a Next.js frontend with Mastra's powerful backend workflows:

### Frontend (Next.js 15 + Supabase Auth)
- **Modern Web Interface**: Built with Next.js App Router and TypeScript
- **User Authentication**: Email/password authentication with Supabase
- **Protected Routes**: Dashboard and user-specific features
- **Responsive Design**: Clean UI with Tailwind CSS

### Backend (Mastra Workflows)
- **Workflow-Based Architecture**: 
  - `healthDataCollectionWorkflow`: Interactive user onboarding and data collection
  - `researchWorkflow`: Health-focused research functionality with suspend/resume
  - `generateReportWorkflow`: Transforms research into personalized wellness plans
- **Health-Focused Agents with Custom Tools**:
  - `healthWellnessAgent`: Primary conversational agent with working memory
  - `researchAgent`: Searches for evidence-based health information
  - `evaluationAgent`: Assesses health source credibility and safety
  - `learningExtractionAgent`: Extracts actionable wellness insights
  - `reportAgent`: Generates structured wellness plans
- **Database Tools**: CRUD operations for health profiles, goals, habits, and plans
- **User-Specific Data**: Each user gets their own Mastra instance and health database

## 🚀 Getting Started

### Prerequisites
- Node.js 20.9.0 or higher
- Supabase project with authentication enabled
- Google Gemini API key
- Exa API key

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd Fin
npm install
```

2. **Set up environment variables**:
Create a `.env` file with:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
DATABASE_URL="your-supabase-database-connection-string"

# AI API Keys
GOOGLE_GENERATIVE_AI_API_KEY="your-google-gemini-api-key"
EXA_API_KEY="your-exa-api-key"
MODEL="gemini-2.5-flash-lite"

# Note: GOOGLE_GENERATIVE_AI_API_KEY is used for both text generation and embeddings
```

3. **Set up Supabase database**:
Run the SQL migration in your Supabase SQL editor:
```sql
-- Copy the contents from supabase/migrations/001_create_health_tables.sql
-- This creates the health-related tables and RLS policies
```

**Note:** To get your `DATABASE_URL`:
1. Go to your Supabase project settings
2. Navigate to Database → Connection String
3. Copy the URI connection string (not the session pooler)
4. Replace `[YOUR-PASSWORD]` with your database password

### Development

```bash
# Start the Next.js frontend (port 3000)
npm run dev

# Start the Mastra backend (separate terminal, port 8080)
npm run mastra:dev
```

### Production Build

```bash
# Build the Next.js application
npm run build

# Start production server
npm start
```

## 🔐 Authentication Flow

1. **Landing Page** (`/`): Shows login and signup links
2. **User Registration** (`/signup`): Create account with email/password
3. **User Login** (`/login`): Authenticate with existing credentials
4. **Protected Dashboard** (`/dashboard`): Access research features (requires authentication)

## 🎯 Key Features

### User Management
- **Email/Password Authentication**: Secure user registration and login
- **Session Management**: Persistent authentication with Supabase cookies
- **User-Specific Data**: Each user gets isolated Mastra instances and databases
- **Route Protection**: Middleware-based authentication guards

### Health & Wellness Capabilities
- **Conversational Data Collection**: Natural conversation to gather health information
- **Personalized Wellness Plans**: Evidence-based plans tailored to user goals and preferences
- **Health Research Integration**: Real-time search for credible health information
- **Goal Tracking**: Set, monitor, and track progress toward health objectives
- **Working Memory**: Persistent user context across conversations
- **Plan Approval System**: Review and approve/reject generated wellness plans

### Technical Features
- **Modern Stack**: Next.js 15, TypeScript, Tailwind CSS
- **Database Integration**: Supabase with Row Level Security (RLS)
- **API Routes**: RESTful endpoints for Mastra workflow execution
- **Error Handling**: Robust error handling and user feedback
- **Build Optimization**: Optimized production builds with proper bundling

## 📁 Project Structure

```
Fin/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected user dashboard
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable React components
│   ├── lib/
│   │   └── supabase/          # Supabase client utilities
│   └── mastra/                # Mastra backend
│       ├── agents/            # AI agents
│       ├── tools/             # Custom tools
│       └── workflows/         # Workflow definitions
├── supabase/
│   └── migrations/            # Database migrations
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── middleware.ts              # Authentication middleware
```

## 🔧 API Endpoints

- **`/api/auth/callback`**: Handles Supabase authentication callbacks
- **`/api/mastra/[...path]`**: Proxies requests to Mastra workflows with user context

## 🛡️ Security Features

- **Row Level Security (RLS)**: Database-level user data isolation
- **Authentication Middleware**: Route protection at the edge
- **User Context Validation**: All API requests verify user authentication
- **Environment Variable Protection**: Secure API key management

## 🚧 Future Development

The health and wellness platform is ready for:

- **Routine Tracking**: Interactive daily/weekly routine checklists with progress visualization
- **Progress Analytics**: Detailed analytics and insights on goal achievement
- **Health Metrics Integration**: Integration with fitness trackers and health devices
- **Community Features**: Sharing wellness plans and progress with friends
- **Advanced AI Features**: Voice interaction and image analysis for health insights

## 📚 Documentation

- [Supabase Authentication Setup](AUTH_SETUP.md) - Detailed setup instructions
- [Mastra Documentation](https://mastra.ai/docs) - Backend workflow documentation
- [Next.js Documentation](https://nextjs.org/docs) - Frontend framework documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

Apache-2.0
