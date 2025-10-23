# Authentication Setup Guide

This guide explains how to set up and use the Supabase authentication system that has been added to the Deep Research Assistant.

## Setup Instructions

### 1. Environment Variables

Make sure your `.env` file contains the following variables (copy from `.env.example`):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
DATABASE_URL="your-supabase-database-connection-string"

# Existing variables
GOOGLE_GENERATIVE_AI_API_KEY="your-google-gemini-api-key"
EXA_API_KEY="your-exa-api-key"
MODEL="gemini-2.5-flash-lite"
```

### 2. Supabase Database Setup

Run the following SQL migration in your Supabase SQL editor:

```sql
-- Copy the contents of supabase/migrations/001_create_health_tables.sql
-- This creates the health-related tables and RLS policies
```

### 3. Running the Application

```bash
# Install dependencies (if not already done)
npm install

# Start the Next.js development server
npm run dev

# For Mastra CLI (separate terminal)
npm run mastra:dev
```

## Application Structure

### Authentication Flow

1. **Landing Page** (`/`): Shows login and signup links
2. **Login** (`/login`): Email/password authentication
3. **Signup** (`/signup`): User registration with email confirmation
4. **Dashboard** (`/dashboard`): Protected area for authenticated users

### Protected Routes

- All routes under `/dashboard/*` require authentication
- Middleware automatically redirects unauthenticated users to `/login`
- User session is maintained using Supabase cookies

### API Integration

- **Auth Callback**: `/api/auth/callback` - Handles OAuth redirects
- **Mastra Integration**: `/api/mastra/*` - Proxies requests to Mastra with user context

## User Context in Mastra

Each user gets their own Mastra instance with a separate database file:
- User ID: `mastra_{userId}.db`
- User context is passed to all workflows and agents
- Ready for future personalization features

## Next Steps

The authentication foundation is now ready for:

1. **Health & Wellness Agent**: Build the personalized AI agent
2. **User Profiles**: Add user preferences and health goals
3. **Conversation History**: Store user-specific chat history
4. **Research Workflows**: Customize research based on user needs

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**: Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
2. **Database errors**: Ensure the SQL migration has been run in Supabase
3. **Redirect loops**: Check middleware configuration and route protection

### Development Tips

- Use browser dev tools to inspect Supabase auth state
- Check Supabase dashboard for user management
- Monitor API routes in Next.js for authentication errors
