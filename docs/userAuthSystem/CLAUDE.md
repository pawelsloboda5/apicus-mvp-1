# Google Authentication Implementation Progress

## Current Analysis Completed ✅

### Existing Architecture Understanding
1. **Data Structures**: Analyzed current `Scenario` interface with ~30 fields including ROI inputs, canvas state, and email data
2. **Storage**: Currently using Dexie (IndexedDB) for client-side storage with 8 schema versions
3. **Dependencies**: NextAuth.js v5.0.0-beta.28 already installed in package.json
4. **Navigation**: Homepage (page.tsx) → Build page (app/build/page.tsx) flow understood
5. **Environment**: Azure OpenAI + MongoDB Cosmos vCore setup confirmed

### Key Findings
- **Critical User Data**: Scenarios (ROI configurations), Email templates, Canvas workflows, Analytics metrics
- **Transient Data**: Node positions during dragging, UI state, temporary selections
- **localStorage Usage**: Minimal (only emailTemplateDefaults cache)
- **Current Flow**: Direct access to /build without authentication

### MongoDB Schema Requirements
Based on existing `Scenario` interface, the user collection needs to store:
- User profile (Google OAuth data)
- Array of scenario documents (complete scenario data)
- User preferences/settings
- Analytics/usage metrics

## ✅ Planning Complete

All requirements confirmed in PLAN.md:
- 5-second debounce for canvas sync
- No guest mode (redirect to homepage)
- All users free tier
- JSON exports
- Platform switching syncs to server
- Global email defaults for new scenarios

## Implementation Strategy - Minimal Changes Per Step

Following user rules for minimal code changes, implementation will proceed:

**Step 1**: Create NextAuth.js configuration file
- Single file: `app/api/auth/[...nextauth]/route.ts`
- Basic Google OAuth setup
- No UI changes yet

**Step 1 Issues Found**: ❌ NextAuth config had compatibility problems

**Problem**: 500 server errors with `Function.prototype.apply` error
- Issue 1: NextAuth v5 beta vs documentation mismatch  
- Issue 2: App Router vs Pages Router syntax differences
- Issue 3: Missing `secret` property in config

**Step 1 Fix Applied**: ✅ Updated NextAuth config (Second Attempt)
- Added `secret: process.env.NEXTAUTH_SECRET` (required)
- Fixed App Router exports: `export { handler as GET, handler as POST }`
- Next.js 15 App Router requires named HTTP method exports, not default exports

**Debugging Results**: ✅ Test endpoint works, all environment variables loaded correctly

**Step 1 Fix Applied**: ✅ Updated to NextAuth v5 (Latest Beta)
- Upgraded from v5.0.0-beta.28 to latest NextAuth beta with `npm i next-auth@beta`
- Updated route.ts to use new v5 syntax: `const { handlers, auth } = NextAuth({...})`
- Simplified Google provider import: `import Google from "next-auth/providers/google"`
- Environment variables now auto-inferred (AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET)
- Using destructured export: `export const { GET, POST } = handlers`

**Environment Variable Changes**: NextAuth v5 auto-infers:
- `AUTH_GOOGLE_ID` (or GOOGLE_CLIENT_ID still works)
- `AUTH_GOOGLE_SECRET` (or GOOGLE_CLIENT_SECRET still works) 
- `AUTH_SECRET` (or NEXTAUTH_SECRET still works)

**Current Status**: NextAuth v5 configured with new syntax, ready for testing
**Next Action**: Test authentication endpoints
