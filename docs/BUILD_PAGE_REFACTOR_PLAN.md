# Build Page Refactor & Completion Plan (React 19 / Next.js 15)

> **Goal**  Finish `app/build/components/BuildPageCore.tsx`, then trim `app/build/page.tsx` to a minimal **server component** wrapper that streams the canvas quickly and never flashes blank.

---
## Phase 0 — Safety Net
1. `app/build/loading.tsx` → lightweight spinner so the route always has a fallback.
2. Copy current `app/build/page.tsx` to `app/build/page.legacy.tsx` (for diff/rollback). *Never imported at runtime.*

---
## Phase 1 — Feature-Parity for `BuildPageCore` ✅ *completed*
• React-Flow handlers migrated (drag/drop, selection, grouping)  
• Viewport persistence + debounced autosave to Dexie  
• ROI snapshot logic via `captureROISnapshot`  
• StatsBar, FlowCanvas, Toolbox fully wired  

`BuildPageCore` now replaces the legacy logic for normal canvas interactions.

---
## Phase 2 — Thin Server Wrapper *(in progress)*
Replace `app/build/page.tsx` with the minimal server component wrapper below:
```tsx
import { Suspense } from 'react';
import BuildPageCore from './components/BuildPageCore';
import LoadingScreen from './loading';

export default function BuildPage({ searchParams }: { searchParams?: { sid?: string; tid?: string; q?: string } }) {
  const { sid, tid, q } = searchParams ?? {};
  return (
    <Suspense fallback={<LoadingScreen />}> {/* never a blank screen */}
      <BuildPageCore
        scenarioIdParam={sid ?? null}
        templateIdParam={tid ?? null}
        queryParam={q ?? null}
      />
    </Suspense>
  );
}
```
*No client-only imports here → fast stream, small bundle.*

---
## Phase 3 — Clean-up & Guards
1. Delete duplicated logic from `page.legacy.tsx` **after** you approve.
2. `next build` and manual smoke-test canvas.
3. Add a `/** TODO: Remove after migration */` banner at top of `page.legacy.tsx`.

---
## Phase 4 — Optional Polish
* Move URL-param extraction back into client component if desired.
* Delete `page.legacy.tsx` when you give the 👍.

---
### Estimated Effort
| Phase | Time |
|-------|------|
| 0 | < 30 min |
| 1 | 2–3 h |
| 2 | 30 min |
| 3 | 30 min |
| **Total** | **≈ 4 h** |

After each phase I'll report "✅ Phase X complete" and list next steps.  No legacy file deletion will occur without explicit permission. 