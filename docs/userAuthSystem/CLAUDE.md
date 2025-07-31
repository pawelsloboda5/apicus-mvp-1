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

**Step 1**: ✅ **COMPLETE** - NextAuth.js authentication working
- NextAuth v5 configuration with Google OAuth
- Authentication endpoints functioning correctly
- Environment variables properly configured

**Step 2**: ✅ **COMPLETE** - AuthProvider component and session management
- Created `components/auth/AuthProvider.tsx` with SessionProvider wrapper
- Updated `app/providers.tsx` to include AuthProvider as outermost wrapper  
- Session context now available throughout the app

**Step 3**: ✅ **COMPLETE** - Authentication UI on homepage
- Added Header component with auth buttons to `app/page.tsx`
- Shows "Sign in with Google" when logged out
- Shows user name + "Sign out" + "Go to Builder" when logged in
- Uses `useSession`, `signIn`, `signOut` from next-auth/react
- Header positioned absolutely at top of page

**Current Status**: ✅ **AUTHENTICATION WORKING PERFECTLY!** 
- Google sign-in/sign-out flow functional 
- Session management working
- UI integration complete
- Issue resolved: Used NextAuth v5 environment variables (AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET)

**Step 1 Complete**: ✅ **Build Page Authentication Gate**
- Added `useSession` hook to build page
- Implemented redirect logic for unauthenticated users
- Preserves query parameters (tid, q, import) during redirect
- Shows loading state while checking authentication
- Prevents access to canvas without authentication

**Step 2 Complete**: ✅ **Template Generation Modal for Unauthenticated Users**
- Created `TemplatePreviewModal.tsx` in `components/auth/`
- Modified homepage template generation to check authentication
- Shows template preview with ROI stats, apps, and features
- Dynamic template data based on search queries
- Beautiful modal with sign-in CTA and Apicus branding
- Integrated with existing `handleGenerate` function

**Next Action**: Test complete authentication flow end-to-end