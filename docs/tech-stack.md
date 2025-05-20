# Web App MVP Technology Documentation

## OpenAI Responses API

OpenAI’s **Responses API** is a stateful chat-based API for interactive AI responses, combining the simplicity
of Chat Completions with tool-use capabilities (function calling and built-in tools). It powers multi-turn
conversations where the AI can remember context and even call functions or tools as needed. Key points
and best practices include:

```
Capabilities & Endpoints: The Responses API supports advanced models (e.g. GPT‑4.1 series)
optimized for multi-turn dialogue and function/tool use. Typically you make a POST request
to the chat endpoint (e.g. /v1/chat/completions or the new /v1/responses endpoint) with a
list of messages and optional function/tool definitions. The API returns a structured response
containing either a message from the assistant or a function call payload.
```
```
Input Format (Messages): Conversations are passed as an array of message objects, each with a
role and content. Roles include "user" (user prompts), "assistant" (AI replies), and
"system" or developer instructions for initial context. For example, you might send:
```
### {

```
"model": "gpt-4.1",
"messages": [
{"role": "system", "content":"You are a helpful ROI calculator
assistant."},
{"role": "user", "content": "Calculate ROI for project X..."}
]
}
```
```
The assistant will then follow the system instructions and user prompt to generate a response. In the
Responses API (early 2025), you can also provide a simpler "input" field: either a single string or
an array of message objects. The API automatically maintains context between calls if you
resend the conversation history in each request (since the server doesn’t store conversation by
itself).
```
```
Assistant Configuration: Use system/developer messages at the start of the messages list to
configure the assistant’s behavior or domain knowledge. This could include instructions like
tone, format, or facts to keep the conversation on-topic. These instructions have priority over user
messages and help the model stay consistent (e.g.
"system": "You are an expert financial assistant..."). You can also specify
parameters like temperature (for randomness) or max_tokens in the API request to control
response style.
```
```
1
```
### •

```
2 3
```
### •

```
4
```
```
5
```
### •

```
4
```

```
Function Calling: The Responses API natively supports function calling – allowing the model to
output a JSON payload calling a function you define. You declare functions in the request (name,
description, and JSON schema of parameters). During conversation, if the model decides a function
is needed (e.g. to look up data or perform a calculation), it will return a special assistant message
with a function_call field instead of a direct answer. For example, after a user asks a conversion
question, the model might return:
```
```
"choices": [{
"message": {
"role": "assistant",
"function_call": {
"name": "convert_currency",
"arguments": "{ \"amount\":100, \"from_currency\":\"EUR\",
\"to_currency\":\"JPY\" }"
}
}
}]
```
```
Your app then executes the corresponding convert_currency function with those arguments,
and sends another API call including the function’s result. In the Responses API, you append a
special message with the function result (using "type": "function_call_output") and the
model will continue the conversation using that result. This mechanism empowers the
assistant to handle calculations, database lookups, web searches, etc., and then produce a final
answer using the function outputs.
```
```
Built-in Tools: In addition to custom functions, OpenAI provides built-in tools (as of 2025) like web
search, file search, and others that can be enabled in the Responses API. These allow the AI to
fetch up-to-date information or retrieve files as part of a single API call. Tools are specified in a
tools array in the request, similar to function definitions. The model can choose to invoke a
tool, and the API will handle the tool execution behind the scenes, returning the result for the model
to use in its next response. This streamlines connecting the model to external data or actions
without complex orchestration.
```
```
Multi-turn Conversation Best Practices: To implement multi-turn chat, maintain a messages list
of the conversation and resend it with each API call (including the latest user query). Append each
new user prompt and the assistant’s reply in order. Keep an eye on token limits – you may
need to truncate or summarize older messages if the conversation grows long. Use the system
message to reinforce context or rules at each turn if needed. The Responses API is designed to
handle complex multi-step tasks within one call as well , but you can also manage turns manually
for fine control. Always check for the presence of a function call in the response; handle it if present,
and then continue the conversation by sending the function result back. By following these practices,
you enable a robust ROI wizard or UI assistant that can converse naturally, utilize tools, and
remember prior inputs throughout the session.
```
### •

```
3
```
```
6 7
```
### •

```
8
```
```
5
```
```
1 9
```
### •

```
10 11
```
```
12
```

## React 19 (Key Features and Updates)

React 19 (released April 2024) introduces significant features and improvements that enhance performance,
server rendering, and the developer experience. It builds upon React 18’s concurrent rendering and
transitions, making formerly experimental features stable. Below are the major updates in React 19 and
guidance for using them:

```
React Server Components (RSC): React 19 stabilizes Server Components, a new way to render parts
of the UI on the server at build or request time. Server Components allow you to fetch data and
render content on the server without sending large JavaScript bundles to the client. They use the file
naming or directive conventions (e.g. files with a .server.jsx extension or the "use server"
directive) to separate server-only logic. This results in faster initial loads and smaller client bundles
by offloading work to the server. For example, a component marked as a Server Component
can await data during rendering and send pre-rendered HTML to the client, improving load time
and SEO. React 19 also introduces directives like "use client" and "use server" to explicitly
designate components or functions for client or server execution. A typical pattern is to have
server-only data fetching components and lightweight client components for interactivity. Server
Components in React 19 can be used with frameworks (like Next.js 15’s App Router) to build full-stack
apps where your React tree seamlessly spans server and client.
```
```
Streaming and SSR Improvements: React 19 improves server-side rendering with streaming. Using
React 18’s Suspense on the server, you can stream HTML in chunks to the browser before the entire
render is finished. React 19 provides new React DOM Static APIs (react-dom/static) like
prerender and prerenderToNodeStream for static generation that waits for all data but still
supports streaming in traditional SSR APIs. In practice, streaming allows the browser to
receive and render parts of the UI sooner (e.g. the shell or layout) while slower components load,
thus enhancing perceived performance. React 19’s integration of streaming with concurrent
rendering means the UI can be incrementally hydrated (Selective Hydration) based on priority –
important pieces become interactive first. For developers, this means you should use
<Suspense> boundaries to wrap slower content and optionally provide a fallback UI; React will
then automatically stream and hydrate in chunks. The result is a smoother user experience with less
blocking on data.
```
```
New Hooks and APIs: Several new hooks and APIs debut in React 19:
```
```
Actions and Transitions: React Actions are a new concept for handling form submissions and
mutations. Paired with <form> elements, they allow using async functions as form actions. Hooks
like useActionState help track form submission status (pending/success/error) without manual
state management. For example, you can assign a server action to a form’s action attribute
and React will handle calling it and managing the optimistic UI update.
useOptimistic: A new hook to simplify optimistic UI updates. It lets you immediately update UI
state and then revert or adjust when an async action completes.
useEvent (Stable Event Handlers): React 19 introduces the useEvent hook to address stale
closure problems with event handlers. This hook creates a stable function reference whose
internal logic always sees the latest state/props. For example, instead of useCallback for an
event handler that depends on component state, you can use useEvent. This ensures that even if
```
```
13
```
### •

```
14
```
```
15 16
```
```
17
```
### •

```
18 19
```
```
20 21
```
```
22
```
### •

### •

```
23
```
### •

```
24
```
-
    25

```
the component re-renders, the event handler uses the most up-to-date values without needing to
rebuild on every change. This results in cleaner code and avoids adding state variables to
dependency arrays just for event handlers.
```
```
use Hook for Data Fetching: React 19 adds a built-in use() hook (not to be confused with
Express middleware) that can be called inside components to consume promises directly. It lets
you use(promise) in a component’s body to suspend rendering until the promise resolves.
This is particularly powerful in Server Components – you can fetch data at the top level of a
component with const data = use(fetch(...)), and React will pause rendering that
component until data is ready (triggering Suspense fallback in the meantime). This hook simplifies
data loading patterns by removing the need for explicit effect hooks in many cases. (Note: use()
can only be used in React 19 with frameworks or libraries that support it, and it requires the promise
to be cacheable or deduplicated to avoid infinite loops .)
```
```
Lifecycle and Concurrent Rendering Behavior: React 19 continues the concurrent rendering
model introduced in 18, with refinements for predictability. In development, React’s Strict Mode still
intentionally mounts/unmounts components twice for detecting side effect issues, so expect effects
to run an extra time as in React 18. The priority-based rendering is improved – updates can be
more finely tuned with transitions. For example, you can use startTransition for low-priority
state updates (like filtering a list) and React will keep the UI responsive by yielding to more urgent
updates. React 19 extends automatic batching and might batch more updates (including some async
scenarios) to avoid unnecessary renders. There were no major new class lifecycle methods;
rather, the focus is on new patterns (hooks and actions) that abstract many lifecycle needs. One
subtle change: starting in React 19, function components can receive a ref prop (React treats
ref as a regular prop for function components) without special forwarding. Also, you can now
render a Context object directly (e.g. <ThemeContext />) as a provider instead of
<ThemeContext.Provider> – a minor ergonomic improvement. Overall, when migrating
from React 18 to 19, most components will work as-is. The official React 19 Upgrade Guide and
codemods help update older patterns. Key migration points include updating to the new hooks if
you want their benefits (e.g. replacing manual useCallback with useEvent for event handlers),
and adopting server components or actions gradually. React 19 is backwards compatible, so you can
upgrade and then opt-in to these features as needed.
```
## Next.js 15 (App Router and Framework Features)

Next.js 15 is a full-stack React framework release that embraces React 19’s capabilities. It introduces a stable
**App Router** architecture and numerous improvements to routing, data fetching, and performance. Below
are the key Next.js 15 features with examples:

```
App Router & Nested Routes: Next.js 15’s App Router (introduced in v13 and stabilized by 15) uses
the filesystem to define routes in an app/ directory. Each folder represents a route segment (and
can contain page.js or page.tsx for the content). Routes can be nested by creating nested
folders, which naturally creates a UI hierarchy. For example:
```
```
/app
layout.tsx (root layout)
```
```
26
```
### •

```
27
```
```
28 29
```
### •

```
30
```
```
31
```
```
32
```
```
33
```
### •


```
└─ dashboard/
layout.tsx (dashboard section layout)
page.tsx (dashboard index page)
└─ settings/
page.tsx (nested route: /dashboard/settings)
loading.tsx (loading UI for this segment)
```
```
In this structure, navigating to /dashboard/settings will render the root layout, then dashboard
layout, and finally the settings page content – composing the UI. Layouts are special components
(e.g. layout.tsx) that wrap child pages and persist across navigations. They allow shared
navigation bars, headers, or stateful logic to remain mounted while different pages load
underneath. Each layout can also include an error.js or loading.js for error boundaries and
suspense fallbacks at that segment. The App Router’s nested routing makes it easy to build complex
UIs with shared layouts and fine-grained control over each route segment’s loading and error states.
```
```
Server Components and Data Fetching: In Next.js 15 App Router, React Server Components are
used by default for pages and layouts (you can still opt into client components with the "use
client" directive as needed). This means you can fetch data directly in your page or layout using
await (or React’s use() hook) without writing custom API routes for simple data needs. For
example, a page component can perform a database query or fetch() call at the top level – the
result will be rendered to HTML on the server. Next.js handles streaming this HTML to the client. You
no longer need getServerSideProps or getStaticProps in the App Router; instead, any
async logic in a Server Component will run on the server. Static Generation and Incremental Static
Regeneration (ISR) are supported via special functions (generateStaticParams for dynamic
routes) or by calling fetch with caching options. Next.js automatically caches and deduplicates
data fetches in the same request to optimize performance.
```
```
Loading UI & Streaming: Next.js 15 leverages React 19’s streaming SSR to provide built-in Loading
UI. You can create a special file loading.js in a route segment, which will act as a Suspense
fallback that renders immediately while the segment’s content is being generated. This gives
users instant feedback (like spinners or skeletons) during navigation. Once the page’s data and
component finish loading, Next.js will automatically swap the loading state with the final UI on the
client. Because of streaming, parent layouts can render and send their HTML to the browser
without waiting for deeper child content. Next.js sends HTML in chunks – for example, your top-level
layout and header might arrive first, and a slower data-heavy component streams in afterward.
Streaming means the browser can start rendering parts of the page earlier, improving perceived
performance. Essentially, Next.js splits the HTML by Suspense boundaries and streams it
progressively. Developers should utilize <Suspense> and loading.js where appropriate to
take full advantage of this. Also, because Next.js ensures the initial <head> and critical scripts are
sent early in the stream, SEO is not affected by streaming – crawlers still see the full content once
loading completes.
```
```
Server Actions (Form Actions): Next.js 15 introduces Server Actions as an ergonomic way to
handle form submissions and server mutations without writing API route code. A Server Action is
essentially an async function that runs on the server, which can be directly invoked from client
```
```
34 35
```
### •

### •

```
36
```
```
36
```
```
20 21
```
```
22
```
### •


```
components. To create one, you mark an async function with the 'use server' directive in
either a React Server Component or a separate module. For example:
```
```
// in a Server Component (e.g., page.tsx)
asyncfunction addTodo(data) {
'use server';
// server-side logic, e.g., database insert
}
```
```
In a Client Component (e.g., a form in a component marked "use client"), you can import and
call this addTodo function directly (e.g., on form submit). Next.js will serialize the call, execute it on
the server, and then send back the result. Under the hood, Server Actions eliminate the need for
writing an API endpoint for simple cases – the framework handles routing the call to the server. They
also integrate with React’s transitions to manage optimistic UI updates and loading states. For
instance, when you call a Server Action from a form, Next.js can automatically optimistically update
the UI and then refresh any affected server components after the action completes. Next.js 15
improved the security of Server Actions by using unguessable action IDs and pruning unused
actions from the client bundle , but you should still treat them as potential attack surfaces (they
essentially generate API endpoints under the hood). In summary, use Server Actions for
convenient, type-safe mutations (like submitting a form to add or update data) without the
ceremony of defining separate API routes.
```
```
Edge Middleware: Next.js 15 supports Edge Middleware , which runs JavaScript at the edge (in
Vercel Edge Network or similar) before a request hits your Next.js routing. Middleware is defined in a
middleware.ts file at the project root. It executes on every request (or specific routes you
configure) and can rewrite URLs, redirect, set headers/cookies, or even return custom responses
```
. For example, you might use middleware to check authentication and redirect users who are not
logged in, or to localize content by rewriting the URL based on geo-IP. Middleware runs very early,
even before serving any cached page, giving you low-level control. A simple example:

```
// middleware.ts
import { NextResponse}from'next/server';
import type{ NextRequest} from'next/server';
export functionmiddleware(request: NextRequest) {
if(request.nextUrl.pathname.startsWith('/admin')) {
// redirect if not authenticated
const isLoggedIn= /* check cookie or auth status */;
if (!isLoggedIn) {
return NextResponse.redirect(newURL('/login', request.url));
}
}
// otherwise, for other routes, just continue
}
```
```
37 38
```
```
39
40
```
### •

```
41
42
```

```
Place logic like the above in middleware.ts. Note that middleware runs on the Edge runtime (by
default) which has some limitations (no Node.js specific APIs). It should be used for quick operations
(blocking long-running work is discouraged). Common use cases include logging, A/B testing
(serve different page variants by rewriting the request), and trivial authentication checks. Next.js
ensures only one middleware file, but you can compose multiple functions within it for organization
```
. By using Edge Middleware, you can significantly improve performance for tasks that would
otherwise require an extra round-trip to a backend server.

```
Additional Improvements: Next.js 15 also brings many quality-of-life improvements. Turbopack
Dev (the new Rust-based dev server) is now stable, greatly speeding up hot-reload and build times in
large apps. There are better error overlays and enhanced hydration error messages to
debug issues when server HTML doesn’t match client state. Support for the new React 19
features is built-in: for example, the App Router can leverage React’s <form> actions and
useOptimistic for instant form UI updates. Next.js 15 remains backward-compatible with the
classic Pages Router – you can incrementally adopt the App Router. In fact, you can run the Pages
router on React 18 and App Router on React 19 simultaneously during transition (though it’s not
generally recommended to mix for long). Finally, Next.js 15 includes updated docs and
codemods to assist in migrating layouts, linking, and other changes from earlier versions.
Overall, this version is geared towards fully utilizing React 19’s capabilities (RSC, streaming,
transitions) while providing a smoother, faster dev experience.
```
## NextAuth.js (Google Sign-In Integration)

NextAuth.js is a flexible authentication library for Next.js. To implement Google Sign-In in a Next.js 15 app
with the simplest setup, follow these steps:

```
Install NextAuth.js: Add the NextAuth package to your project. For example:
```
```
npminstall next-auth
```
```
If using Next.js 14 or 15 App Router, ensure you have a recent NextAuth (v4.XX or the @next-auth
beta) that supports Route Handlers. You’ll also need to obtain OAuth 2.0 credentials from
Google (Client ID and Client Secret) via the Google Developers Console.
```
```
Configure NextAuth Route: NextAuth works by creating a dynamic API route that handles all auth
flows. In the App Router, create a file at app/api/auth/[...nextauth]/route.ts (the [...]
catch-all is required). Inside, import NextAuth and the Google provider, then export NextAuth’s
handler for GET and POST:
```
```
import NextAuthfrom"next-auth";
import GoogleProviderfrom"next-auth/providers/google";
```
```
consthandler= NextAuth({
providers: [
GoogleProvider({
```
```
43
44
```
```
45
```
### •

```
46 47
48 49
```
```
50 51
52
```
### 1.

```
53 54
```
### 2.


```
clientId: process.env.GOOGLE_CLIENT_ID!,
clientSecret: process.env.GOOGLE_CLIENT_SECRET!
})
],
secret: process.env.NEXTAUTH_SECRET
// ... (other NextAuth options like callbacks can go here)
});
```
```
export { handlerasGET, handlerasPOST};
```
```
This configures NextAuth with the Google OAuth provider using your credentials (stored in
environment variables). The secret is used to encrypt session tokens (you can generate a 32-
byte secret as shown in NextAuth docs). By exporting handler for both GET and POST,
Next.js will route both authorization callbacks and sign-in POST requests to NextAuth.
NextAuth will automatically handle routes like /api/auth/signin, /api/auth/callback/
google, and /api/auth/signout under the hood.
```
```
Set Environment Variables: In your .env.local (or environment configuration), add the
credentials:
```
```
GOOGLE_CLIENT_ID=<your Google OAuthclient id>
GOOGLE_CLIENT_SECRET=<your clientsecret>
NEXTAUTH_SECRET=<a randomsecret for sessions>
NEXTAUTH_URL=http://localhost:3000 # (your app URL, needed in some
setups)
```
```
Ensure these are available in the Next.js runtime (you might need to prefix with NEXT_PUBLIC_ for
any that need to be exposed to client, but clientId/secret and secret should remain server-only). The
Google OAuth credentials must have authorized redirect URIs set to your domain + /api/auth/
callback/google for OAuth to work (e.g., http://localhost:3000/api/auth/callback/
google for dev) – configure that in Google’s console.
```
```
Initiate Sign-In and Use Session: NextAuth provides React hooks and utilities to initiate sign-in and
access the authenticated user. On any page or component where you want a login button, you can
use the signIn function from next-auth/react:
```
```
"use client";
import { signIn, signOut, useSession }from"next-auth/react";
```
```
export defaultfunctionLoginButton() {
const{ data: session, status } = useSession();
```
```
if(status=== "loading") return <p>Loading...</p>;
if(session) {
// User is authenticated
```
```
55
56 57
58 59
```
```
60 61
```
### 3.

```
62
```
### 4.


```
return (
<div>
<p>Signedinas{session.user?.email}</p>
<buttononClick={()=> signOut()}>Signout</button>
</div>
);
}
return<button onClick={()=> signIn("google")}>SigninwithGoogle</
button>;
}
```
```
The useSession() hook gives you the current session object and status. If the user is not
logged in, calling signIn("google") will redirect to Google’s OAuth screen (NextAuth knows the
Google provider from your configuration). Upon success, Google redirects back to your
/api/auth/callback/google route, which NextAuth handles, then the user is considered signed
in. By default, NextAuth uses an encrypted JWT cookie session (unless you configure a database) –
the session is stored in a cookie, so no explicit database is required for basic usage. The session
cookie contains the user’s ID and basic profile (the OAuth tokens are kept server-side or encrypted).
```
```
Provide the Session to App (App Router specifics): In Next.js App Router, you must wrap your
application with NextAuth’s SessionProvider (from next-auth/react) in a Client Component
context so that useSession works throughout the app. Because layouts and pages by default
are Server Components, you should create a providers client component. For example, create
app/providers.tsx:
```
```
"use client";
import { SessionProvider} from"next-auth/react";
```
```
export defaultfunctionProviders({ children }) {
return<SessionProvider>{children}</SessionProvider>;
}
```
```
Then import and include this <Providers> at the root of your layout.tsx, so it wraps your
app’s UI (ensure to mark it as a client component via "use client" at top). This setup ensures
any descendant can call useSession() to get the logged-in user, and it keeps the session state in
sync (it uses a context under the hood). Alternatively, on the server you can use NextAuth’s
getServerSession() in an async Server Component to check the session on the server side
(for protected pages). But for most cases, using SessionProvider + useSession in client
components is the simplest approach to access session info.
```
With these steps, you have a working Google Sign-In: the user clicks “Sign in with Google,” gets redirected
to Google, and on return NextAuth creates a session. You can now protect pages (e.g., conditionally render
content based on session or use Next.js middleware to redirect if no session cookie), and use
signOut() for logout. NextAuth also provides default pages for signin/signout if you don’t create custom
UI – for instance, visiting /api/auth/signin will show a generic sign-in page with a Google option by

```
63 64
```
### 5.

```
65
```

default. This minimal setup abstracts away the OAuth complexity, letting you add secure Google
authentication to your app quickly. (For production, don’t forget to set up your environment variables and
OAuth credentials appropriately, and consider configuring NextAuth callbacks or database if you need to
persist user accounts.)

## IndexedDB & Dexie.js (Client-Side Storage)

**IndexedDB** is the browser’s low-level API for client-side storage of significant amounts of structured data.
**Dexie.js** is a lightweight wrapper around IndexedDB that makes it easier to work with by providing a
Promise-based, intuitive API and optional React hooks. When using Dexie in a React app, you can structure
and access local data much like a mini-database. Key aspects of using IndexedDB with Dexie include:

```
Defining Database Schema: With Dexie, you declare your database and object stores (tables) up-
front in a declarative schema. You start by creating a Dexie instance and defining the schema via
version(...).stores() calls. For example:
```

```
import Dexiefrom'dexie';
export constdb =new Dexie("MyAppDB");
db.version(1).stores({
// Define a "projects" table with auto-incremented primary key and
indexes
projects: '++id, name, category',
// Another example table
users:'id, email, name'
});
```

```
In the schema string, the first field before a comma is the primary key (here id ). ++id denotes an
auto-increment primary key. Subsequent fields (name, category etc.) are indexed properties for
querying. For instance, in projects: '++id, name, category', id will be a unique
primary key, and Dexie will create secondary indexes on name and category for efficient queries.
You can indicate a unique secondary index by prefixing it with & , or make a compound index with
[fieldA+fieldB] if needed (Dexie supports advanced indexing). Defining the schema is
declarative – if the database doesn’t exist or an upgrade is needed, Dexie handles it via IndexedDB’s
upgrade mechanism. You can increment the version number and modify the .stores()
schema to perform migrations (adding/removing stores or indexes); Dexie will execute the upgrade
transaction accordingly.
```

```
Creating, Reading, Updating, Deleting (CRUD): Once the schema is set, Dexie exposes tables via
db.tableName. You can use these to perform CRUD operations with familiar methods:
```

```
Add / Update: Use db.projects.add({...}) to insert a new object (returns a Promise of the
new key). For example:
await db.projects.add({ name: "Project X", category: "Finance", roi: 42 });.
Use db.projects.put({...}) to add or update (it will overwrite if primary key exists). To update
specific fields of an existing record, use db.projects.update(key, { field: newValue }).
```
### •

```
66 67
```
```
68 69
```
### •

### •


```
Query / Read: Dexie provides powerful query methods. You can get a record by primary key:
const project = await db.projects.get(id). For searches, use indexes: for example,
db.projects.where('category').equals("Finance").toArray() will retrieve all projects in
the Finance category. You can also do range queries (above, below, between) on indexed fields
, or use compound index queries. Dexie queries return promises, so you typically await them.
You can chain filters or sorts as needed (e.g. .equalsIgnoreCase() for strings, .sortBy() on
an index, etc.).
Delete: db.projects.delete(id) removes an item by key. Or .clear() to wipe all records in
a store.
```
All operations are async (returning a Promise) because IndexedDB works asynchronously. You should
handle errors (e.g. using try/catch or .catch) especially for things like quota exceeded or constraint
violations. Dexie’s API **batch** operations in a transaction when possible. You can also explicitly use
transactions (db.transaction('rw', db.table1, db.table2, () => { ... })) if you need multi-
step atomic changes.

```
Using Live Queries in React: A standout feature of Dexie is its live query capability via the
liveQuery() API and the React hook useLiveQuery() (available through the dexie-react-
hooks package). useLiveQuery() allows a React component to automatically react to database
changes without manual subscriptions. You provide a function (the query) that returns a promise or
value from the database, and the hook will cause the component to re-render whenever the result of
that query might have changed. For example:
```
```
import { useLiveQuery}from"dexie-react-hooks";
import { db }from"./db"; // your Dexie instance
```
```
consthighROIProjects = useLiveQuery(
() => db.projects.where('roi').above(50).toArray(),
[] // dependencies, if any external variables used in the query
);
if(!highROIProjects) return<p>Loading...</p>;
return (
<ul>
{highROIProjects.map(p => <li key={p.id}>{p.name}: ROI{p.roi}%</li>)}
</ul>
);
```
```
In this example, the component will initially render “Loading...” until the query promise resolves.
Once the data is loaded, it displays the list of project names and ROIs. Crucially, if any project with
ROI > 50 is added, updated, or deleted in the database through Dexie , the useLiveQuery will
detect the change and re-run the query, causing the UI to update automatically. This turns
IndexedDB into a reactive state store – you don’t need to manually use React state for the data that
lives in the DB, avoiding duplication of source-of-truth. Under the hood, Dexie’s liveQuery tracks
what parts of the database the query accessed and subscribes to those tables/indices, delivering
fine-grained change notifications. Note that changes must be done via Dexie’s API to be observed
(changes from outside or devtools won’t trigger it). With this approach, you can treat Dexie as a
```
### •

```
70
```
### •

### •

```
71 72
```
```
73 74
```
```
75
```

```
persistent store that seamlessly updates your UI on data changes, which is ideal for offline-first apps
or caching data in the browser.
```
```
Best Practices for React Integration: When integrating IndexedDB/Dexie in a React app, consider
the following:
```
```
Single Shared Instance: Create your Dexie database instance once (for example, in a module file as
shown above) and reuse it across components. This ensures all components talk to the same
IndexedDB connection and benefit from Dexie’s internal caching. Opening multiple Dexie instances
to the same DB is usually unnecessary.
Component Lifecycles: Because Dexie queries are async, your components should handle loading
states. As seen with useLiveQuery, the result is undefined until the promise resolves. You
should render a loading indicator or nothing in that interim. Also, be mindful of unmounted
components – if you use promises directly, cancel or ignore results if the component unmounted to
avoid memory leaks.
Error Handling: Wrap database calls in try/catch or use .catch on promises to handle exceptions
(e.g. quota errors or version upgrades failing). Dexie throws errors that you can catch and perhaps
show to the user (for example, if storage is full or the data couldn’t be written).
Version Upgrades: When changing your schema (adding new object stores or indexes), bump the
version number in db.version(n) and provide a new .stores() definition. Dexie will handle
the upgrade transaction. You can also use Dexie’s migration callbacks (e.g. .upgrade(tx =>
{...})) to transform data during an upgrade. Always test upgrades to ensure you don’t
accidentally lose data.
Performance: IndexedDB operations are pretty fast, but avoid doing heavy queries on the main
thread without using Dexie’s hooks or splitting work. For large datasets, consider using Dexie’s bulk
operations (bulkAdd, bulkPut) which are more efficient than looping many single adds.
Usage with Context/State: You might combine Dexie with React Context to provide certain data or
DB methods to components. For example, a context could expose a custom hook that uses
useLiveQuery internally to fetch common data (like current user preferences from IndexedDB)
and provide it to the app. This can simplify consuming the data.
```
In summary, Dexie.js simplifies IndexedDB by providing a fluent API for defining schemas and working with
data, while its React hooks enable your UI to stay in sync with the database effortlessly. By structuring data
into tables with appropriate indexes and using live queries for reactive updates, you can maintain a client-
side datastore (for offline support, caching, or complex data) that feels like using React state – but
persisted. Remember to keep business logic (like complex querying or large data transformations) possibly
outside the render if needed (Dexie can be used in web workers too, if ever necessary for very heavy work).
For most use cases though, a combination of Dexie’s simple queries and useLiveQuery will yield a clean,
maintainable local storage solution for your Next.js MVP.

New tools for building agents | OpenAI
https://openai.com/index/new-tools-for-building-agents/

Function Calling in the OpenAI API | OpenAI Help Center
https://help.openai.com/en/articles/8555517-function-calling-in-the-openai-api

### •

### •

### •

```
76
```
### •

### •

### •

### •

```
77 71
```
```
1 8 9 12
```
```
2 3
```

How can I use the Chat Completion API? | OpenAI Help Center
https://help.openai.com/en/articles/7232945-how-can-i-use-the-chat-completion-api

OpenAI Responses API: The Ultimate Developer Guide | DataCamp
https://www.datacamp.com/tutorial/openai-responses-api

React 19 : New Features and Updates | GeeksforGeeks
https://www.geeksforgeeks.org/react-19-new-features-and-updates/

React v19 – React
https://react.dev/blog/2024/12/05/react-

React 19 New Features: Server Components, useActionState, useOptimistic, and More Explained!
| by Rahul Kaklotar | JavaScript in Plain English
https://medium.com/@kaklotarrahul79/react-19-new-features-server-components-useactionstate-useoptimistic-and-more-
explained-df9170ee3c8b

Routing: Loading UI and Streaming | Next.js
https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming

React 18 vs React 19 (RC): Key Differences and Migration Tips with Examples - DEV Community
https://dev.to/manojspace/react-18-vs-react-19-key-differences-and-migration-tips-18op

Data Fetching: Server Actions and Mutations | Next.js
https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

Next.js 15 | Next.js
https://nextjs.org/blog/next-

Routing: Middleware | Next.js
https://nextjs.org/docs/app/building-your-application/routing/middleware

App Router: Adding Authentication | Next.js
https://nextjs.org/learn/dashboard-app/adding-authentication

Google | NextAuth.js
https://next-auth.js.org/providers/google

Initialization | NextAuth.js
https://next-auth.js.org/configuration/initialization

Getting Started | NextAuth.js
https://next-auth.js.org/getting-started/example

Client API | NextAuth.js
https://next-auth.js.org/getting-started/client

Understanding the basics
https://dexie.org/docs/Tutorial/Understanding-the-basics

useLiveQuery()
https://dexie.org/docs/dexie-react-hooks/useLiveQuery()

```
4
```
```
5 6 7 10 11
```
```
13 34 35
```
```
14 18 19 23 24 27 28 29 31 32 33
```
```
15 16 17
```
```
20 21 22 36
```
```
25 26 30
```
```
37 38
```
```
39 40 46 47 48 49 50 51 52
```
```
41 42 43 44 45
```
```
53 54 56 57
```
```
55 62
```
```
58 59
```
```
60 61
```
```
63 64 65
```
```
66 67 68 69 77
```
```
70 71 72 73 74 75 76
```



