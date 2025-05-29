# React 18 → 19 Upgrade Report (and Next.js 15.3.2)

## 1  Performance Highlights

| Area | React 19 Gain | Notes |
|------|---------------|-------|
| **Compilation** | *Experimental React Compiler* automatically memoises pure components | Eliminates many manual `memo`/`useCallback` usages |
| **Render Batching** | State updates outside events (`setTimeout`, promises) are batched | Fewer re-renders, smoother workflow-canvas drags |
| **SSR & Hydration** | Faster streaming + Suspense “pre-warm” | Better FCP, quicker ROI dashboard display |
| **Resource Hints** | `preload` / `preinit` APIs | Pre-fetch workflow-canvas icons, fonts |
| **Concurrent Updates** | Refined `useTransition` | Keeps canvas panning 60 fps during heavy edits |

> React 19 release notes (Dec 2024) detail these optimisations.

---

## 2  Breaking/Deprecated Items

| Category | Change | Required Action |
|----------|--------|-----------------|
| **JSX Transform** | Old `React.createElement` pragma removed | Ensure `tsconfig.json` has `"jsx": "react-jsx"` |
| **Root API** | `ReactDOM.render`/`hydrate` removed | Use `createRoot` / `hydrateRoot` (Next 15 already does) |
| **Legacy Context** | `contextTypes` / `getChildContext` removed | Migrate to `createContext` |
| **`defaultProps`** | Ignored on function components | Use ES6 default params |
| **Error Surfacing** | Errors routed to `window.reportError` | Add `onUncaughtError` if you relied on old behaviour |
| **PropTypes** | Stripped in prod & dev warnings removed | Delete any lingering `propTypes` blocks |
| **Ref Access** | Reading `element.ref` now throws | Refactor string-ref or `props.ref` access |

---

## 3  Known Warnings After Upgrade

* **Out-of-date JSX transform** – update TS/Babel if you see “outdated JSX” warning.  
* **`element.ref` access** – remove code that inspects `props.ref`.  
* **React-test-renderer** deprecated – migrate to React Testing Library.  
* **TypeScript** – `useRef()` must pass an initial value; ref callbacks must not return a value.

---

## 4  Next.js 15.0 → 15.3.2 Changes

| Topic | Impact | What to Check |
|-------|--------|---------------|
| **Config keys renamed** | `experimental.bundlePagesExternals` → `bundlePagesRouterDependencies`<br>`serverComponentsExternalPackages` → `serverExternalPackages` | Update `next.config.js` |
| **Edge runtime flag** | `runtime: 'experimental-edge'` removed | Replace with `'edge'` |
| **Default fetch caching** | No caching by default in App Router | Add `export const fetchCache = 'default-cache'` or `cache: 'force-cache'` |
| **Async cookie APIs** | Cookie helpers are now async | Update any cookie parsing logic |
| **Turbopack** (stable) | 28–83 % faster builds | Opt-in via `next.config.js` or CLI |

---

## 5  Third-Party Library Compatibility

| Library | Status w/ React 19 | Action |
|---------|-------------------|--------|
| **React Flow v12** | ✅ Supports React 19 (peer deps updated) | Upgrade `reactflow`, `zustand@latest` |
| **Tailwind CSS** | Unaffected | None |
| **Dexie** | Works, but SSR guard needed | Initialise inside `useEffect` or client-only files |
| **Azure OpenAI SDK** | Unaffected | None |

---

## 6  Apicus.io File-Level Checklist

| File / Module | Why it Changes | How to Update |
|---------------|---------------|---------------|
| `package.json` | New deps | `npm i react@^19 react-dom@^19 @types/react@^19 @types/react-dom@^19 next@^15.3.2 reactflow@latest zustand@latest` |
| `tsconfig.json` | New JSX | `"jsx": "react-jsx"`; resolve any `useRef()` TS errors |
| `next.config.js` | Renamed fields, edge runtime | Replace deprecated keys; set `runtime: 'edge'` |
| `app/**/*.tsx` (server comps) | Fetch caching defaults | Add `fetchCache` / `dynamic = 'force-static'` as needed |
| Components with `defaultProps`, `propTypes`, or string refs | Removed APIs | Convert to default params, delete PropTypes, use `useRef` |
| Dexie init file | SSR safety | Guard with `if (typeof window !== 'undefined')` |
| Any custom SSR root code | Old root API | Swap to `createRoot` / `hydrateRoot` |

---

## 7  Upgrade Steps

1. **Branch & CI** – create `upgrade/react19-next1532` branch; add GitHub Action matrix for both versions.  
2. **Dependencies** – run install command above; commit lockfile.  
3. **Codemods** – `npx @types/react-codemod new-jsx-transform` then `npx @types/react-codemod use-ref-init`.  
4. **Fix TS errors** – especially `useRef()` initial values and returning refs.  
5. **Lint & Build** – `next build` with `--turbo`; watch for warnings.  
6. **E2E tests** (React Flow drag-drop, ROI calc) – verify no runtime crashes.  
7. **Deploy to Vercel preview** – compare build time & Lighthouse scores.  

---

## 8  References

* React 19 Release Notes – react.dev/blog/2024-12-05-react-19  
* React 19 RFCs & Changelog – github.com/facebook/react/pull/27801  
* Next.js 15 Upgrade Guide – nextjs.org/docs/app/guides/upgrading/version-15  
* Turbopack Benchmarks – vercel.com/blog/nextjs-15-3-turbopack  

