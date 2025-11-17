# Authentication Setup Guide

This guide explains how to set up and use the Supabase authentication system that has been added to the Deep Research Assistant.

## Setup Instructions

### 1. Environment Variables

Make sure your `.env` file contains the following variables (copy from `.env.example`):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
DATABASE_URL="your-supabase-database-connection-string"

# Existing variables
GOOGLE_GENERATIVE_AI_API_KEY="your-google-gemini-api-key"
EXA_API_KEY="your-exa-api-key"
MODEL="gemini-2.5-flash-lite"
```

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` is required for server-side account creation without email confirmation. To get this key:
1. Go to your Supabase project settings
2. Navigate to API → Project API keys
3. Copy the `service_role` key (keep this secret - it bypasses Row Level Security)

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

The application supports two authentication flows:

#### Guest Onboarding Flow (Passwordless Account Creation)

1. **Guest Experience** (`/`): Unauthenticated users can interact with the guest onboarding agent
2. **Data Collection**: Guest collects sleep routine, health metrics, and preferences
3. **Email Collection**: When ready, guest provides their email address
4. **Automatic Account Creation**: 
   - Account is created immediately using Supabase Admin API
   - No email confirmation required
   - No password required
   - User is automatically signed in
   - Guest conversation is summarized and sent as first message to longevity coach
5. **Authenticated Experience**: User is immediately redirected to the authenticated app experience

#### Traditional Authentication Flow

1. **Login** (`/login`): 
   - Email/password authentication
   - Magic link authentication (passwordless option)
2. **Signup** (`/signup`): User registration with email/password
3. **Protected Routes**: All authenticated routes require valid session

### Protected Routes

- Authenticated routes require valid session
- Middleware automatically redirects unauthenticated users to `/login`
- User session is maintained using Supabase cookies

### API Integration

#### Account Creation & Sign-In APIs

- **`/api/auth/create-and-signin`**: 
  - Creates user account using Supabase Admin API
  - Generates magic link token programmatically
  - Creates session immediately without requiring email click
  - Returns session data for client-side authentication
  
- **`/api/auth/summarize-guest-conversation`**:
  - Retrieves guest conversation history from Mastra memory
  - Generates summary using guest onboarding agent
  - Returns summary to be used as first message for longevity coach

- **`/api/auth/complete-onboarding`**:
  - Orchestrates the full onboarding completion process
  - Calls `create-and-signin` to create account and get session
  - Calls `summarize-guest-conversation` to get conversation summary
  - Sends summary as first message to longevity coach agent
  - Returns session for client-side authentication

#### Other APIs

- **Auth Callback**: `/api/auth/callback` - Handles OAuth redirects
- **Mastra Integration**: `/api/mastra/*` - Proxies requests to Mastra with user context

## User Context in Mastra

Each user gets their own Mastra instance with a separate database file:
- User ID: `mastra_{userId}.db`
- User context is passed to all workflows and agents
- Ready for future personalization features

## How Passwordless Account Creation Works

### Technical Implementation

The passwordless account creation flow uses Supabase's Admin API to bypass normal authentication requirements:

1. **User Creation**: 
   - Uses `admin.createUser()` with `email_confirm: true` to skip email verification
   - Checks if user already exists by listing users and searching by email
   - Creates new user if not found

2. **Session Creation**:
   - Uses `admin.generateLink()` with type `'magiclink'` to generate a magic link
   - Extracts `hashed_token` from `linkData.properties.hashed_token` (not from URL)
   - Uses `verifyOtp()` with `token_hash` to create session programmatically
   - This approach works because `hashed_token` from `generateLink()` is designed for programmatic use

3. **Client-Side Authentication**:
   - Session data (access_token, refresh_token) is returned to client
   - Client uses `supabase.auth.setSession()` to establish authenticated session
   - User is immediately signed in without clicking any email link

### Why This Approach?

- **No Email Confirmation**: Users can start using the app immediately
- **No Password Required**: Reduces friction in onboarding
- **Magic Links for Future Logins**: Users can sign in with magic links on subsequent visits
- **Seamless Transition**: Guest conversation context is preserved and sent to authenticated agent

### Security Considerations

- Uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS - only use server-side
- Magic link tokens are single-use and expire quickly
- Admin API operations are logged in Supabase dashboard
- User accounts are created with confirmed email addresses

## Magic Link Authentication

For subsequent logins, users can use magic links:

1. **Login Page**: Users can choose between password or magic link authentication
2. **Magic Link Request**: User enters email and receives magic link via email
3. **Email Click**: User clicks link in email to sign in
4. **Session Creation**: Supabase handles session creation automatically

The login page (`/login`) supports both methods:
- **Password**: Traditional email/password authentication
- **Magic Link**: Passwordless authentication via email link

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**: Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
2. **"Missing Supabase admin environment variables"**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
3. **"Database error creating new user"**: Check for database triggers or constraints that might be blocking user creation
4. **"Token has expired or is invalid"**: This shouldn't happen with the current implementation using `hashed_token` from `generateLink()`
5. **Database errors**: Ensure the SQL migration has been run in Supabase
6. **Redirect loops**: Check middleware configuration and route protection

### Development Tips

- Use browser dev tools to inspect Supabase auth state
- Check Supabase dashboard for user management
- Monitor API routes in Next.js for authentication errors
- Check server logs for detailed error messages (prefixed with `[create-and-signin]`)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct in Supabase dashboard → API → Project API keys

### Debugging Account Creation

If account creation fails, check:
1. Server logs for `[create-and-signin]` prefixed messages
2. Supabase Auth logs in dashboard for detailed error information
3. Database triggers on `auth.users` table that might be interfering
4. Ensure `user_profiles` trigger was removed (see migration `008_drop_user_profiles_trigger.sql`)
