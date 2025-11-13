## Development Guide (Next.js + tRPC + Supabase + Mastra + React Query + Tailwind)

Audience: Developers who already have the app running. For prerequisites and setup, see README → Prerequisites & Setup.

**Related Guides**:
- Mastra Integration: See [MASTRA_GUIDE.md](./MASTRA_GUIDE.md) for details on Mastra agents, tools, and workflows

### Tech Stack

- Next.js App Router (TypeScript, RSC-first)
- tRPC with Zod validation
- React Query client cache
- Supabase auth/session (`@supabase/ssr`)
- Supabase database (via tRPC routers)
- Mastra agents, tools, workflows
- Tailwind CSS + shadcn/ui

Link to setup: see README.md → Prerequisites & Setup.

### Project Structure

```
src/
  app/
    (auth)/              # Public auth routes (login, signup)
      layout.tsx
      login/
      signup/
    (app)/                # Route group for all authenticated pages
      layout.tsx          # Auth gate + PageOverlayProvider + ChatPageLayout
      dashboard/          # Dashboard page
        page.tsx
      # Add new logged-in pages here - they automatically get chat interface
    api/
      trpc/[trpc]/       # tRPC HTTP endpoint
      auth/              # Auth callbacks
      chat/              # Mastra streaming chat endpoints
        route.ts         # Authenticated chat
        guest/           # Guest onboarding chat
    layout.tsx           # Root layout + Providers
    page.tsx             # Landing page (guest onboarding)
    globals.css
    providers.tsx        # Client-only providers (tRPC + React Query + Toast)
  features/
    dashboard/           # Dashboard feature components
      dashboard-content.tsx # Dashboard page content
    onboarding/          # Guest onboarding components
      guest-onboarding.tsx # Guest onboarding client component
      guest-onboarding-content.tsx # Guest onboarding page content
      guest-onboarding-tracker.tsx
      sleep-routine-progress.tsx
  components/
    chat/                # All chat-related components
      authenticated-chat-interface.tsx # Chat for logged-in users
      guest-chat-interface.tsx # Chat for guests
      chat-interface-base.tsx # Base chat component
      message-content.tsx # Message rendering
      types.ts           # Chat types
    layouts/             # Layout components
      chat-page-layout.tsx # Two-column layout (desktop) + mobile overlay
    ui/                  # shadcn components (auto-generated)
      toast.tsx          # Toast notification system
    admin/               # Admin components
    page-overlay.tsx     # Page overlay provider
  lib/
    hooks/               # Custom React hooks
    supabase/            # Supabase clients
      client.ts          # Browser client
      server.ts          # Server client
      middleware.ts      # Session middleware
      realtime.ts        # Realtime subscriptions
    trpc-client.ts       # tRPC React client
    sleepRoutine.ts      # Sleep routine utilities
    unitConversions.ts   # Unit conversion utilities
    utils.ts             # General utilities
    database.types.ts    # Auto-generated Supabase types
    active-page.ts       # Active page metadata resolution
  config/
    navigation-targets.ts # Navigation destinations for agent/UI
  server/
    api/
      root.ts            # Root tRPC router
    routers/             # Domain routers
    context.ts           # tRPC context (Supabase)
    trpc.ts              # tRPC init
  mastra/
    agents/              # Mastra agents
    tools/               # Mastra tools
    workflows/           # Mastra workflows
    storage.ts           # Mastra storage (Postgres)
    index.ts             # Mastra instances
  types/                 # TypeScript type definitions
supabase/
  migrations/            # Database migrations
```

### Conventions

- **Files/dirs**: kebab-case; components: PascalCase; functions/vars: camelCase
- **Routers live in** `src/server/routers/` and export `<domain>Router` (e.g., `guestRouter`)
- **Server Components by default**: Use `'use client'` only when needed (state, event handlers, tRPC hooks)
- **Placement**:
  - `features/`: domain-specific feature components organized by feature
  - `components/ui/`: shadcn primitives
  - `components/`: shared/reusable components
  - `lib/`: shared utilities and hooks

### Types

- **Single Source of Truth**: All database types derive from `src/lib/database.types.ts` (auto-generated from Supabase schema)
- **Domain Type Files**: Create type exports in `src/types/<domain>.ts` for each database table/domain
- **Never define local data interfaces in components** - always use centralized types
- **Component Props**: Component props interfaces (`XxxCardProps`) are fine - they're UI-specific
- **Mastra Types**: Agent/chat types (Mastra API responses) remain local since they're not database entities

**Creating Domain Types**:
- For each database table, create `src/types/<domain>.ts`
- Export Row, Insert, Update types from `Database['public']['Tables']['table_name']`
- Export enums from `Database['public']['Enums']['enum_name']`
- For relationships, extend base types with intersection types

**Enum Types**:
- Use proper enum types from database types, not `string`
- In tRPC routers, use enum constants from `database.types.ts` for Zod validation
- Reference: See `src/server/routers/guest.ts` for enum usage in Zod schemas

### Pages & Components

- **Create a page**: `src/app/{route}/page.tsx` (public) or `src/app/(app)/{route}/page.tsx` (authenticated)
- **Protected routes**: All pages under `(app)/` route group automatically get authentication and chat interface via `(app)/layout.tsx`
- **Prefer Server Components**: Add `'use client'` for state, event handlers, or tRPC hooks
- **Client Component Naming**: Do not use `-client` suffix in filenames or component names. The `'use client'` directive is sufficient. Use descriptive names like `dashboard.tsx` with `Dashboard` component, not `dashboard-client.tsx` with `DashboardClient`.
- **Server/Client Pattern**: Server Component pages (`page.tsx`) handle auth and data fetching, then pass props to Client Components in `features/` folder for interactivity.
- **Content Components Pattern**: Create `*-content.tsx` components in `features/` folder that contain page-specific UI. These components work in both desktop (right column) and mobile (overlay) contexts.
- **Reference**: See existing pages in `src/app/**/page.tsx` and client components in `src/features/`

### Root Page Pattern

The root route (`/`) is accessible to both authenticated and non-authenticated users, but displays different content based on authentication status:

- **Location**: `src/app/page.tsx` handles the root route
- **Non-authenticated users**: See `GuestOnboarding` component for guest onboarding flow
- **Authenticated users**: See the main app with tabbed interface, chat, and `PageOverlayProvider` wrapper

**Implementation Pattern**:
```typescript
// src/app/page.tsx
import { createClient } from '@/lib/supabase/server'
import GuestOnboarding from '@/features/onboarding/guest-onboarding'
import { PageOverlayProvider } from '@/components/page-overlay'
import ChatPageLayout from '@/components/layouts/chat-page-layout'
import MainContent from '@/features/app/main-content'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Authenticated: Full app with chat interface
    return (
      <PageOverlayProvider>
        <div className="h-full bg-muted/50">
          <main className="h-full flex flex-col">
            <ChatPageLayout
              userId={user.id}
              userEmail={user.email || ''}
              contentComponent={<MainContent userId={user.id} />}
            />
          </main>
        </div>
      </PageOverlayProvider>
    )
  }
  
  // Non-authenticated: Guest onboarding
  return <GuestOnboarding />
}
```

**Key Points**:
- Both user types can access `/` - no redirects needed
- Authentication check happens in the page component itself
- Authenticated users get the full app experience (chat + tabs)
- Non-authenticated users get the guest onboarding experience
- This pattern avoids route conflicts and provides a seamless experience

**Reference**: See `src/app/page.tsx` for the implementation

### Feature Tabs Pattern

The main app uses a tabbed interface where each tab represents a distinct feature. Currently, the app has three feature tabs:

- **My Routine** (`my-routine`)
- **Activity Log** (`activity-log`)
- **Profile** (`profile`)

**Creating a New Feature Tab**:

1. **Create the feature component** in `src/features/[feature-name]/[feature-name]-tab.tsx`:
   ```tsx
   'use client';

   interface MyFeatureTabProps {
     userId: string;
   }

   export default function MyFeatureTab({ userId }: MyFeatureTabProps) {
     return (
       <div className="h-full flex items-center justify-center p-8">
         <div className="text-center text-muted-foreground">
           <p className="text-lg font-medium mb-2">My Feature</p>
           <p className="text-sm">Content coming soon</p>
         </div>
       </div>
     );
   }
   ```

2. **Add the tab to the main content component** (`src/features/app/main-content.tsx`):
   - Import the new tab component
   - Add a `TabsTrigger` with the tab value (e.g., `"my-feature"`)
   - Add a `TabsContent` that renders the component

3. **Tab state is automatically tracked** by `PageOverlayProvider` - no additional setup needed

**Tab State Management**:

- Tab state is managed through the `PageOverlayProvider` context
- **State**: `activeTab` (string) - the currently active tab value
- **Setter**: `setActiveTab(tab: string)` - function to change the active tab
- **Access**: Use the `usePageOverlay()` hook to access `activeTab` and `setActiveTab`
- The active tab is automatically included in `currentPage.metadata.activeTab` when on root route (`/`)
- Agents receive tab information via `currentPage.metadata.activeTab` in their runtime context

**Tab Naming Convention**:

- Tab values should use kebab-case (e.g., `my-routine`, `activity-log`)
- Default tab is `"my-routine"` - update in `PageOverlayProvider` if you want a different default

**Reference**: See `src/features/app/main-content.tsx` for the tabbed interface implementation

### Layout Pattern for Authenticated Pages

All logged-in pages automatically use the two-column layout pattern:

- **Desktop**: Chat interface (left column) + Page content (right column)
- **Mobile**: Chat interface (full screen) + Page content (overlay/drawer that slides over chat)
- **Layout Location**: `src/app/(app)/layout.tsx` wraps all pages under `(app)/` route group
- **Shared Chat**: All logged-in pages use the same `AuthenticatedChatInterface` component
- **Main App Route**: Authenticated users are served at `/` (root route) via `src/app/page.tsx` - the same route that non-authenticated users access, but with different content (see Root Page Pattern section)
- **Adding New Pages**: For feature tabs, add to `src/features/app/main-content.tsx`. For separate pages, create `src/app/(app)/{page-name}/page.tsx` and `src/features/{page-name}/{page-name}-content.tsx` - the layout automatically provides the chat interface

**Content Component Pattern**:
- Create `src/features/{feature-name}/{feature-name}-content.tsx` for page-specific UI
- Component should be self-contained with all its logic
- Accept props needed for functionality
- Work seamlessly in both desktop column and mobile drawer contexts
- Handle its own loading/error states

**Example - Adding a New Page**:
1. Create `src/app/(app)/profile/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server';
import ProfileContent from '@/features/profile/profile-content';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Not authenticated</div>;
  }

  return <ProfileContent userId={user.id} />;
}
```

2. Create `src/features/profile/profile-content.tsx`:
```typescript
'use client';

interface ProfileContentProps {
  userId: string;
}

export default function ProfileContent({ userId }: ProfileContentProps) {
  return (
    <div className="h-full p-4">
      {/* Your page content here */}
    </div>
  );
}
```

The `(app)/layout.tsx` automatically provides:
- Authentication check
- Chat interface in left column (desktop) or full screen (mobile)
- Layout wrapper
- Page content in right column (desktop) or overlay (mobile)

**Guest Onboarding Pattern**:
- Guest onboarding is shown to non-authenticated users at the root route (`/`)
- Located at `src/app/page.tsx` - the same route that authenticated users access
- Uses `GuestOnboarding` component which includes `ChatPageLayout` with `GuestChatInterface`
- The root page checks authentication and conditionally renders either guest onboarding or the authenticated app
- **Reference**: See `src/app/page.tsx` for the root page implementation and `src/features/onboarding/guest-onboarding.tsx` for the guest onboarding component

### Chat Components Organization

All chat-related components are consolidated in `src/components/chat/`:

- **`authenticated-chat-interface.tsx`**: Chat interface for all logged-in users (shared across all authenticated pages)
- **`guest-chat-interface.tsx`**: Chat interface for guest onboarding
- **`chat-interface-base.tsx`**: Base chat component with message handling, streaming, and UI
- **`message-content.tsx`**: Component for rendering message content (markdown, links, etc.)
- **`types.ts`**: Shared TypeScript types for chat (`Message`, `ChatConfig`)

**Best Practices**:
- All chat components live in `src/components/chat/` for consistency
- Use `AuthenticatedChatInterface` for all logged-in pages (automatically provided by `(app)/layout.tsx`)
- Use `GuestChatInterface` only for guest onboarding
- Extend `ChatInterfaceBase` if creating new chat variants
- **Reference**: See `src/components/chat/` for all chat components

### Toast Notifications

- **Global toast utilities live in** `src/components/ui/toast.tsx`; already wrapped in `src/app/providers.tsx`
- **Access toasts via** `const { showToast } = useToast()` inside client components
- **Success pattern**: `showToast({ title: 'Success', description: 'Operation completed successfully' })`
- **Keep toasts concise** (title ≤ 40 chars, description ≤ 120 chars) and prefer upper-right placement handled by the provider
- **Reference**: See `src/components/ui/toast.tsx` for implementation

### Page Overlay & Active Page Metadata

The page overlay system provides agents with full context about what the user is currently viewing, enabling context-aware responses and navigation assistance.

**Architecture Overview**:
- The protected layout wraps app content with `PageOverlayProvider` (`src/components/page-overlay.tsx`), which tracks overlay visibility and derives the active page metadata via `resolveActivePage()` (`src/lib/active-page.ts`)
- Mobile chat surfaces this metadata (icon/title/link) in `ChatHeader`; the agent navigation tool consumes the same data. Add new destinations in `src/config/navigation-targets.ts` so both UI and agent stay aligned

**Page Context Structure**:
- `ActivePageMetadata`: `{ route, title, icon?, link, metadata? }` - See `src/lib/active-page.ts`
  - `metadata.activeTab`: The currently active feature tab (when on root route `/`)
- `OverlayState`: `{ isOpen, type: 'drawer' | 'modal' | 'sheet' | null, content? }` - See `src/lib/active-page.ts`

**Passing Context to Agent**:
- Page context is passed to the agent on every message via `RuntimeContext`
- **Client-Side**: Chat components use `usePageOverlay()` hook to get `currentPage` and `overlayState`, then include them in the request body
- **Server-Side**: Chat API routes extract `currentPage` and `overlayState` from request body and add to `RuntimeContext` via `runtimeContext.set()`
- **Reference**: See `src/components/chat/authenticated-chat-interface.tsx` for client-side pattern, `src/app/api/chat/route.ts` for server-side pattern

**Overlay State Tracking**:
- Components that open overlays (drawers, modals, sheets) must update the overlay state using `setOverlayState()` from `usePageOverlay()` hook
- **Reference**: See `src/components/page-overlay.tsx` for hook implementation

**Page Resolution Logic**:
- The `resolveActivePage()` function in `src/lib/active-page.ts` determines the active page based on:
  1. Current route (from Next.js router)
  2. Overlay state (if overlay is open, overlay content takes precedence)
  3. Navigation targets configuration
- **Reference**: See `src/lib/active-page.ts` for implementation

**Navigation Targets Configuration**:
- Define all navigable destinations in `src/config/navigation-targets.ts`
- Each target has: `id`, `route`, `title`, `icon?`, `description?`
- **Reference**: See `src/config/navigation-targets.ts` for structure

**Tab Context for Agents**:
- When on root route (`/`), `PageOverlayProvider` automatically includes `activeTab` in `currentPage.metadata`
- Chat interface includes this metadata in every message payload sent to agents
- Agents receive `currentPage.metadata.activeTab` in their runtime context
- This allows agents to know which feature tab is currently visible and navigate between tabs

**Best Practices**:
1. **Always pass context**: Include `currentPage` and `overlayState` in every chat message request
2. **Single source of truth**: Define all navigation targets in `navigation-targets.ts`
3. **Update overlay state**: Any component that opens/closes overlays must update `PageOverlayProvider` state
4. **Update tab state**: Use `setActiveTab()` from `usePageOverlay()` to change tabs programmatically
5. **Agent instructions**: Include page context awareness in agent instructions (e.g., "You know what page and tab the user is currently viewing")
6. **Fallback handling**: The `usePageOverlay()` hook returns safe defaults if used outside provider context
7. **Performance**: Page context is lightweight metadata - passing it on every message is acceptable
8. **Tab navigation**: Agents can navigate tabs using navigation tools (see MASTRA_GUIDE.md for tool patterns)

**Reference Examples**:
- Provider: `src/components/page-overlay.tsx`
- Resolution logic: `src/lib/active-page.ts`
- Navigation targets: `src/config/navigation-targets.ts`
- Client usage: `src/components/chat/authenticated-chat-interface.tsx`
- Server usage: `src/app/api/chat/route.ts`

### API Routes

- **tRPC Endpoint**: Single HTTP endpoint at `src/app/api/trpc/[trpc]/route.ts` handles all data operations
- **Streaming Chat**: Create streaming endpoints in `src/app/api/chat/**/route.ts` for Mastra agents only
- **Auth Check**: Always verify authentication in protected routes using `createClient()` from `@/lib/supabase/server`
- **Error Handling**: Return proper HTTP status codes and JSON error responses
- **Reference**: See `src/app/api/chat/route.ts` for authenticated streaming, `src/app/api/chat/guest/route.ts` for guest streaming

### tRPC APIs

- **Create router at** `src/server/routers/<domain>.ts` with Zod validation
- **Register router in** `src/server/api/root.ts` and export `AppRouter`
- **Client usage via** `src/lib/trpc-client.ts` and React Query hooks in client components
- **Reference examples**: See `src/server/routers/guest.ts` for router pattern, `src/server/api/root.ts` for registration

**⚠️ CRITICAL: Always Use tRPC for Data Fetching**

- **Never use direct Supabase queries in pages or components** - always use tRPC endpoints instead
- tRPC hooks require `'use client'` - convert Server Component pages to Client Components if you need data fetching
- **Direct Supabase queries are ONLY allowed in**: layouts (auth checks), route handlers, tRPC routers, server actions, Mastra tools
- **Reference examples**: See `src/server/routers/guest.ts` for router patterns

### Auth (Supabase)

- **Server Components (Layouts, Pages)**: Use `createClient()` from `@/lib/supabase/server` to read cookies for authentication
- **Route Handlers & Server Actions**: Use `createClient()` from `@/lib/supabase/server` for full cookie support
- **tRPC Context**: Uses `createClient()` from `@/lib/supabase/server` (reads cookies via Next.js `cookies()` API)
- **Reference examples**: See `src/app/dashboard/layout.tsx` for Server Component auth, `src/server/context.ts` for tRPC context

**Available Functions**:
- `createClient()` (from `@/lib/supabase/server`) - For server components, route handlers, and tRPC context. Reads cookies via Next.js `cookies()` API.
- `createClient()` (from `@/lib/supabase/client`) - Browser client for client components. Handles cookie storage automatically.

### Agents (Mastra)

- **Define in**: `src/mastra/agents/`
- **Two Instances**: 
  - `mastra` - For authenticated users (defined in `src/mastra/index.ts`)
  - `guestMastra` - For guest onboarding (defined in `src/mastra/index.ts`)
- **Wire tools**: Add tools to agent configuration
- **Reference**: See `src/mastra/agents/guestOnboardingAgent.ts`

### Tools

- **Create in**: `src/mastra/tools/`
- **Validation**: Use Zod schemas for input/output validation
- **Runtime Context**: Access runtime context via `runtimeContext.get()` for session/user data and page context
- **Database Access**: Mastra tools can use direct Supabase queries (exception to tRPC rule) since they run in agent context
- **Page Context**: Access `currentPage` and `overlayState` from runtime context to provide context-aware responses
- **Reference**: See `src/mastra/tools/guestOnboardingTools.ts`

### Workflows

- **Create in**: `src/mastra/workflows/`
- **Compose steps**: Chain agents and tools together
- **Reference**: See existing workflows in `src/mastra/workflows/` (if any)

### Chat API Patterns

- **Streaming Response**: Use `ReadableStream` for streaming chat responses
- **Runtime Context**: Pass user/session data and page context via `RuntimeContext` (see Page Overlay & Active Page Metadata section)
- **Memory**: Use Mastra memory for conversation persistence
- **Error Handling**: Catch errors and send error messages in stream
- **Page Context**: Always include `currentPage` and `overlayState` in request body and pass to `RuntimeContext`
- **Reference**: See `src/app/api/chat/route.ts` for authenticated chat, `src/app/api/chat/guest/route.ts` for guest chat

### Database Updates (MCP)

- **Project ID**: `pzouiicohbuxaljkyirm`
- **Project URL**: `https://pzouiicohbuxaljkyirm.supabase.co`
- Use MCP Supabase tools via Cursor for schema changes and migrations

**Making Schema Changes**:
- Use `mcp_supabase_apply_migration` to create migrations for DDL operations (CREATE, ALTER, DROP)
- Use `mcp_supabase_execute_sql` only for SELECT queries, not for schema changes
- After schema changes, regenerate types: `supabase gen types typescript --project-id pzouiicohbuxaljkyirm > src/lib/database.types.ts`
- Review migrations with `mcp_supabase_list_migrations` before applying
- Check for security issues with `mcp_supabase_get_advisors` after schema changes

**Viewing Current Schema**:
- List all tables: `mcp_supabase_list_tables`
- List extensions: `mcp_supabase_list_extensions`
- List migrations: `mcp_supabase_list_migrations`

**Security Checks**:
- After making schema changes, always check for security and performance issues
- Use `mcp_supabase_get_advisors({ type: "security" })` for missing RLS policies
- Use `mcp_supabase_get_advisors({ type: "performance" })` for performance issues

### Validation & Errors

- **Validate all tRPC inputs with Zod**
- **Return human-readable messages**: Don't leak sensitive details
- **Error Handling**: tRPC automatically handles validation errors; return user-friendly messages in routers

### State & Data Fetching

- **Use React Query via tRPC hooks**: Invalidates caches after mutations
- **Server Components**: Can use tRPC server-side calls for initial data, but prefer client-side tRPC hooks for interactivity
- **Realtime**: Use Supabase Realtime subscriptions for live updates (see `src/lib/supabase/realtime.ts`)

### React Query Best Practices

- **Global Configuration**: Configure default options in `src/app/providers.tsx` to prevent unnecessary refetches and improve UX
  - Set `refetchOnWindowFocus: false` to prevent automatic refetches when window regains focus
  - Set `staleTime: 5 * 60 * 1000` (5 minutes) to keep data fresh longer and reduce refetch frequency
  - These defaults apply to all queries unless overridden
  - **Reference**: See `src/app/providers.tsx`

- **Prevent Loading State Flashes**: Use `placeholderData` to preserve previous data during background refetches
  - Prevents components from showing loading skeletons during refetches
  - Improves UX by maintaining visual continuity
  - Use `placeholderData: (previousData) => previousData` pattern

- **When to Use placeholderData**:
  - Use for queries that display static or slowly-changing data (e.g., user profiles, settings)
  - Use when refetches are frequent but shouldn't disrupt the UI
  - Don't use for real-time data that must be instantly updated (e.g., live chat messages)
  - Don't use if showing stale data could cause confusion or errors

- **Query Configuration Guidelines**:
  - Default behavior: All queries inherit global defaults (no refetch on window focus, 5-minute stale time)
  - Override when needed for special cases (real-time data, critical updates)
  - Prefer longer `staleTime` for static/slowly-changing data
  - Use `refetchOnWindowFocus: true` only for data that must be fresh on focus

### Infinite Scroll (Cursor-Based Pagination)

- **Pattern**: Use tRPC `useInfiniteQuery` with Intersection Observer API for automatic pagination
- **Consistency**: All paginated feeds should follow the same pattern for maintainability
- **Reference implementations**: See `src/server/routers/` for router patterns and `src/components/**` for feed components

**Server-Side Implementation (tRPC Router)**:
- Accept optional `cursor` and `limit` (default: 20, max: 100)
- **CRITICAL**: If cursor is provided, fetch the cursor item first to get its `created_at` timestamp
- **CRITICAL**: Filter the query in SQL using `query.lt('created_at', cursorCreatedAt)` - do NOT filter client-side
- Fetch `limit + 1` items to detect if more exist
- Return `{ items, nextCursor, hasMore }`

**Client-Side Implementation (Feed Component)**:
- Use `api.<domain>.<proc>.useInfiniteQuery()` with `getNextPageParam: (lastPage) => lastPage.nextCursor`
- Create `loadMoreRef` with `useRef<HTMLDivElement>(null)`
- Set up Intersection Observer in `useEffect` that calls `fetchNextPage()` when sentinel is visible
- Check `hasNextPage && !isFetchingNextPage` before fetching
- Clean up observer on unmount
- Flatten pages: `data?.pages.flatMap((page) => page.items) ?? []`
- Render sentinel div only when `hasNextPage` is true

**Required States**:
- Loading skeleton for initial load (`isLoading`)
- Error state with message (`isError`, `error`)
- Empty state when no items
- Loading indicator in sentinel when fetching next page (`isFetchingNextPage`)

**Intersection Observer Config**:
- Threshold: `0.1` (triggers when 10% visible)
- Dependencies: `[fetchNextPage, hasNextPage, isFetchingNextPage]`
- For scrollable containers: Detect the scroll container and set it as the observer's `root` with `rootMargin: '100px'` to trigger slightly before reaching bottom

**⚠️ Common Pitfall to Avoid**:
- **WRONG**: Don't fetch all items and filter client-side by finding the cursor index
- **CORRECT**: Fetch the cursor item's timestamp first, then filter in the SQL query using `query.lt('created_at', cursorCreatedAt)`

### Security & Performance

- **Prefer Server Components**: Reduce client bundle size
- **Avoid unnecessary `'use client'`**: Only use when needed
- **Verify auth on server**: Always check authentication in server components and API routes
- **Keep secrets off client**: Only expose `NEXT_PUBLIC_*` environment variables
- **RLS Policies**: Ensure all tables have proper Row Level Security policies

### Checklists

**Add a page**:
- **Public page**: Create `src/app/{route}/page.tsx`
- **Authenticated page**: Create `src/app/(app)/{route}/page.tsx` - automatically gets auth check and chat interface via `(app)/layout.tsx`
- **Root page**: The root route (`/`) at `src/app/page.tsx` handles both authenticated and non-authenticated users with conditional rendering
- Create content component: `src/features/{feature-name}/{feature-name}-content.tsx`
- Link in navigation if needed
- **Reference**: See `src/app/page.tsx` for root page pattern, `src/app/(app)/admin/page.tsx` for authenticated page pattern

**Add a tRPC API**:
- Create `src/server/routers/<domain>.ts` with Zod
- Register in `src/server/api/root.ts`; export `AppRouter`
- Use `api.<domain>.<proc>.useQuery/useMutation` in client

**Add an agent/tool/workflow**:
- Agent in `src/mastra/agents/`; Tool in `src/mastra/tools/`; Workflow in `src/mastra/workflows/`
- Expose streaming via `src/app/api/chat/<route>/route.ts` or non-streaming via tRPC

### Notes

- This guide intentionally omits setup. See README for environment variables and local dev commands.
- Mastra instances are separated: `mastra` for authenticated users, `guestMastra` for guest onboarding
- **All database queries go through tRPC** - except in Mastra tools, layouts (auth checks), and route handlers
- Streaming chat endpoints use Server-Sent Events (SSE) format
- Memory/storage is handled by Mastra's PostgresStore for conversation persistence
- Page overlay system provides agent context awareness - always pass `currentPage` and `overlayState` in chat requests
