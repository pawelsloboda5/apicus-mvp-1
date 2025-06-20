import { Suspense } from 'react';
import LoadingScreen from './loading';
// Import the legacy component which is the production version
import BuildPageLegacy from './page.legacy';

// Server component wrapper – avoids executing client-only Dexie logic during SSR
export default async function BuildPage({
  searchParams,
}: {
  // Starting with Next.js 15, `searchParams` is **asynchronous** and must be awaited.
  // It can still be a plain object during the transition period, hence the union type.
  searchParams?:
    | Promise<{ sid?: string; tid?: string; q?: string }>
    | { sid?: string; tid?: string; q?: string };
}) {
  // BuildPageLegacy handles params internally via useSearchParams
  // so we don't need to pass them as props
  return <BuildPageLegacy />;
}