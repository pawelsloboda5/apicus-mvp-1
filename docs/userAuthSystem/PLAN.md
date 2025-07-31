# Google Authentication Implementation Plan

## Overview
Implement Google OAuth login using NextAuth.js v5 with smart server-side persistence for critical user data while maintaining optimal performance for high-frequency canvas operations.

## 1. Database Schema Design

### MongoDB Collection: `apicus-users`
```typescript
interface ApicusUser {
  _id: ObjectId;
  
  // Authentication & Profile
  authId: string; // NextAuth user.id
  email: string;
  name: string;
  image?: string;
  provider: 'google';
  
  // Account Management
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
  
  // User Scenarios (Critical Data)
  scenarios: Scenario[]; // Complete scenario objects from existing interface
  
  // User Preferences
  preferences: {
    defaultPlatform: 'zapier' | 'make' | 'n8n';
    defaultROISettings: {
      hourlyRate: number;
      taskMultiplier: number;
      taskType: string;
    };
    emailDefaults: {
      yourName: string;
      yourCompany: string;
      yourEmail: string;
      calendlyLink?: string;
    };
  };
  
  // Usage Analytics
  usage: {
    totalScenarios: number;
    totalEmails: number;
    lastActive: Date;
    planType: 'free' | 'pro'; // Future expansion
  };
}
```

## 2. Authentication Infrastructure

### 2.1 NextAuth.js Configuration
- **File**: `app/api/auth/[...nextauth]/route.ts`
- **Provider**: Google OAuth 2.0
- **Session Strategy**: JWT with database user lookup
- **Callbacks**: Custom user creation/update logic

### 2.2 Auth Provider Component
- **File**: `components/auth/AuthProvider.tsx`
- **Purpose**: Wrap app with session context
- **Features**: User state management, automatic token refresh

### 2.3 Auth Hooks
- **File**: `lib/hooks/useAuth.ts`
- **Functions**: `useUser()`, `signIn()`, `signOut()`, `isAuthenticated()`

## 3. User Interface Changes

### 3.1 Homepage (page.tsx)
**Current State**: Direct access to template generation
**New State**: 
- **Logged Out**: Same UI + Login/Signup buttons in header
- **Logged In**: User avatar/menu in header + "Go to Builder" button
- **Template Generation**: Show modal for unauthenticated users

#### Modal for Unauthenticated Template Generation
```
┌─ Template Preview Modal ──────────────┐
│ 🎯 [Template Title]                   │
│                                       │
│ 📱 Apps: [App Icons]                 │
│ ⚡ Platform: Zapier                   │
│ 📊 Estimated ROI: 340%               │
│                                       │
│ To continue building this automation: │
│                                       │
│ [🔐 Sign in with Google] [📝 Sign up] │
│                                       │
│ └─────────────── [✕] ─────────────────┘
```

### 3.2 Build Page Access Control
- **Unauthenticated**: Redirect to homepage with login prompt
- **Authenticated**: Full access to canvas and features

## 4. Data Synchronization Strategy

### 4.1 Critical Data (Server-Stored)
**Immediate Sync Required**:
- Scenario creation/deletion/renaming
- ROI configuration changes
- Email template completion
- Final canvas state saves

### 4.2 Performance Data (Client-Only)
**No Server Sync**:
- Node drag positions (real-time)
- Canvas viewport changes
- Temporary UI selections
- Undo/redo stack

### 4.3 Smart Sync Implementation
```typescript
// Debounced save for canvas changes
const debouncedCanvasSync = useDebouncedCallback(
  (scenarioId: string, canvasData: CanvasData) => {
    syncScenarioToServer(scenarioId, { 
      nodesSnapshot: canvasData.nodes,
      edgesSnapshot: canvasData.edges,
      viewport: canvasData.viewport 
    });
  },
  2000 // 2 second delay
);

// Immediate sync for critical changes
const immediateSyncTriggers = [
  'scenario_rename',
  'roi_settings_change', 
  'email_generation',
  'scenario_delete'
];
```

## 5. API Routes

### 5.1 User Management
- `POST /api/user/scenarios` - Create scenario
- `PUT /api/user/scenarios/:id` - Update scenario  
- `DELETE /api/user/scenarios/:id` - Delete scenario
- `GET /api/user/scenarios` - Get all user scenarios
- `PUT /api/user/preferences` - Update preferences

### 5.2 Data Migration
- `POST /api/user/migrate-local` - Migrate IndexedDB to server

## 6. Migration Strategy

### 6.1 Existing Users (Local Data)
1. **Detection**: Check for existing IndexedDB scenarios on login
2. **Migration Prompt**: Offer to import local scenarios
3. **Import Process**: POST to `/api/user/migrate-local` with Dexie data
4. **Cleanup**: Clear local storage after successful migration

### 6.2 New Users
1. **Onboarding**: Create user document with default preferences
2. **First Scenario**: Auto-create from template selection

## 7. Environment Variables Required
```bash
# NextAuth.js
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Existing MongoDB (already configured)
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=your_database_name
```

## 8. Implementation Phases

### Phase 1: Auth Foundation
1. Configure NextAuth.js with Google provider
2. Create auth API routes and middleware
3. Build AuthProvider component and hooks
4. Test authentication flow

### Phase 2: Database & API
1. Design and implement user collection schema
2. Create user management API routes
3. Build data sync utilities
4. Test server-side data operations

### Phase 3: UI Integration
1. Update homepage with auth buttons and modals
2. Add authentication gates to build page
3. Implement user menu and profile components
4. Test complete user journey

### Phase 4: Data Migration
1. Build local data detection and migration
2. Implement smooth transition for existing users
3. Add data backup/export features
4. Performance testing and optimization

## 9. Risk Mitigation

### 9.1 Performance Concerns
- **Solution**: Smart sync strategy with debouncing
- **Monitoring**: Track API response times and canvas performance
- **Fallback**: Local-first with background sync

### 9.2 Data Loss Prevention
- **Solution**: Automatic local backup before migration
- **Recovery**: Export/import functionality for scenarios
- **Versioning**: Track scenario update timestamps

### 9.3 Authentication Failures
- **Solution**: Graceful degradation to guest mode
- **Session**: Proper session refresh and error handling
- **Offline**: Continue working with local storage when offline

## Questions for Review

1. **Server Sync Frequency**: Is 2-second debounce appropriate for canvas changes, or should it be longer/shorter?

2. **Guest Mode**: Should unauthenticated users be able to use a limited "guest mode" with session-only storage?

3. **Scenario Limits**: Should we implement scenario limits for free vs. pro users?

4. **Data Export**: What format should we use for scenario export/backup? (JSON, CSV, etc.)

5. **Email Integration**: Should user email preferences be synced across all scenarios or per-scenario?

6. **Platform Switching**: How should we handle users switching between platforms (Zapier/Make/n8n) in terms of data organization?
