**Next.js 15.4.0-canary.56**

Next.js 15 brings major new APIs and behaviors optimized for **React 19**. The App Router now runs on React 19 \(with Pages Router backwards-compatible with React 18\) 1 . New features include experimental data-fetching APIs, updated caching defaults, and tools for server instrumentation. For example, Next.js 15

adds an experimental unstable\_after\(\) API to **defer work until after the response has streamed**

2 , and a stable instrumentation.js hook for server-side observability. The release notes highlight React 19 support and hydration improvements, as well as performance updates \(Turbopack, faster builds, etc.\) 3

4 . 

**React 19 Support:**

• 

Next.js 15 officially supports React 19. The App Router defaults to React 19 RC, and code migrations \(via codemods\) are provided 1

3 . This aligns Next.js with React’s latest features \(see React section below\). 

**Async Data APIs \(br**

• 

**eaking\):** Many App Router data-fetching APIs \( cookies\(\) , headers\(\) , params , searchParams , etc.\) are now **async**. Components that consume these must be async functions \(e.g. export async function Page\(\) \{ const cookies = await cookies\(\); \} \)

5

6 . This change allows the server to begin rendering without waiting on request-specific data. 

**Caching semantics:**

• 

Caching defaults have changed in Next 15. In the App Router, GET route

handlers and the client-side router **no longer cache by default**; pages and navigations fetch fresh data unless explicitly opted into static mode \(e.g. export const dynamic = 'force-static' \)

7

8 . This makes client and GET handlers uncached by default, improving consistency and predictability. 

**Rendering, Streaming, and Lazy Loading**

Next.js 15 leverages React 19’s streaming support. Server Components \(in the App Router\) are streamed by default, enabling faster **First Contentful Paint** by sending chunks as they become ready 9 . Pages can define a loading.tsx or loading.js file to automatically wrap the page in a React Suspense boundary. For example, placing /app/dashboard/loading.tsx shows fallback UI \(e.g. skeleton screens\) while the page’s data loads 10 . Next.js also supports streaming at the component level by manually wrapping parts of your tree in <Suspense> with a fallback. 

Client-side code splitting is handled via next/dynamic or React’s built-in lazy \+ Suspense . For example, to defer loading a heavy component until needed: 

import dynamic from 'next/dynamic' 

const DynamicHeader = dynamic\(\(\) => import\('../components/Header'\), \{

loading: \(\) => <p>Loading header...</p>, 

ssr: false

// Optionally disable SSR for this component

\}\)

export default function Page\(\) \{

1

return <DynamicHeader /> 

\}

This uses next/dynamic to split out Header into a separate bundle and shows a fallback during load

11 . The ssr: false option can disable server-rendering for client-only components \(useful if they depend on window \). By default, Server Components are auto-split; lazy loading only applies to **Client** **Components **12 . 

**Code-Splitting and Streaming Example**

// pages/index.js \(Pages Router\)

import dynamic from 'next/dynamic' 

import \{ Suspense \} from 'react' 

const ExpensiveComponent = dynamic\(\(\) => import\('../components/Expensive'\), \{

suspense: true \}\)

export default function HomePage\(\) \{

return \(

<Suspense fallback=\{<div>Loading...</div>\}> 

<ExpensiveComponent /> 

</Suspense> 

\)

\}

In this example, ExpensiveComponent is code-split. Next.js streams HTML for the <Suspense> boundary and then hydrates the loaded component when ready. This pattern improves performance by deferring non-critical JS. 

**Performance Optimizations**

Next.js 15 emphasizes build and runtime performance. The stable Next.js dev server now uses **Turbopack** by default, yielding much faster incremental rebuilds and fast refresh. Version 15.3 introduced an alpha of next build --turbopack , dramatically speeding up production builds \(e.g. ~28–83% faster build times depending on CPU cores\) 13 . These tools require minimal configuration; one can enable Turbopack in next.config.ts under the turbopack key 14 . 

Additionally, Next.js 15.3 introduced a **client instrumentation hook** \( instrumentation-client.js \) that runs *before* the app code, ideal for setting up analytics or error tracking \(e.g. marking performance\) as early as possible 15 . This allows measuring real-user performance from initial load. 

2

**Routing and Server-Side Rendering**

Next.js 15 retains the App Router and Pages Router behaviors. Static vs. dynamic route indicators are now visible in development \(a badge shows which routes are statically rendered\) 16 . However, some caveats exist in Next 15.4 canary: a known bug causes **dynamic routes to be indexed as soft 404** when deployed. 

This is due to issues in the new <Image> and <Link> components breaking SSR on dynamic pages 17 . 

In practice, Googlebot may see dynamic pages \(e.g. app/\[slug\]/page.js \) as “404” because SSR failed. A temporary workaround is to block /\_next/static/chunks/app/ in robots.txt until this is fixed 17 . 

For standard SSR/SSG usage, Next.js 15 still supports getStaticProps and getServerSideProps in the Pages Router \(backwards-compatible with React 18\), and Server Components in the App Router. 

Hydration error messages have been improved: instead of multiple logs, Next.js now shows a unified diff when client and server markup mismatch 18 , greatly aiding debugging. 

**Server Hooks and Background Tasks**

Next.js 15 adds new server-side hooks for advanced use:

• **unstable\_after \(Experimental\):** You can now schedule noncritical work to run *after* the response is sent. In next.config.js , enable experimental.after: true , then call import 

\{ unstable\_after as after \} from 'next/server' inside a Server Component, Server Action, Route Handler, or Middleware. Any function passed to after\(\) will execute after the HTML

has streamed to the client, without delaying the response 2 19 . This is ideal for logging or analytics that shouldn’t block rendering. 

• **instrumentation.js \(Stable\):** Create a file instrumentation.js in the project root and export a register\(\) function to hook into Next.js server events \(request start/end, errors, etc.\). 

This enables plugging in observability tools \(OpenTelemetry, Sentry, etc.\) at the framework level 20

21 . For example, an onRequestError\(err, req, ctx\) function can capture error context across the app 22 . 

**Enhanced Forms \( next/form \)**

Next.js 15 introduces a built-in <Form> component \(from next/form \) that extends HTML <form> elements with client-side navigation and prefetching. When a <Form action="/some-route"> is in view, Next.js preloads the target route and shows its loading UI, and on submit it navigates client-side \(preserving layouts and state\) 23 24 . This eliminates boilerplate: previously developers had to manually intercept form submits and call router.push\(\) 25 . The new <Form> ensures fast client navigation and also falls back to normal navigation if JS is disabled. \(See official docs for usage examples 23 26 .\) **Known Issues**

**Dynamic r**

• 

**oute SSR soft-404:** As noted above, dynamic \[param\] routes can fail SSR under certain conditions \(new Image/Link\), causing SEO/indexing issues 17 . This is under investigation. 

3

**Canary changes:**

• 

Because this is a canary build, APIs may still change. Always check the latest Next.js issue tracker or release notes for any fixes related to 15.4.0 \(e.g. updates to Turbopack flags, experimental options, etc.\). 

**React 19.0.0 & ReactDOM 19.0.0**

React 19 is a major release with new concurrency and async data capabilities. The key features include **first-class support for “actions” \(async transitions\)**, improved Suspense, new hooks for form status and optimistic updates, and new server/SSR APIs. The React blog outlines these in detail 27 28 . Below are highlights relevant to React 19.0.0:

**Concurrent Features and “Actions” **

React 19 treats user-initiated asynchronous updates as **“Actions” **. You can wrap an async function in a transition to automatically handle pending states and errors. For example, before React 19 one might write: function UpdateName\(\) \{

const \[name, setName\] = useState\(""\); 

const \[isPending, setIsPending\] = useState\(false\); 

const \[error, setError\] = useState\(null\); 

const handleSubmit = async \(\) => \{

setIsPending\(true\); 

const errorMsg = await updateNameAPI\(name\); 

setIsPending\(false\); 

if \(errorMsg\) \{

setError\(errorMsg\); 

\}

\}; 

return \(

<button onClick=\{handleSubmit\} disabled=\{isPending\}>Update</button> 

\); 

\}

In React 19, you can leverage startTransition for cleaner code that automatically manages pending state and errors 29 . For example: import \{ useTransition \} from 'react'; 

function UpdateName\(\) \{

const \[name, setName\] = useState\(""\); 

const \[error, setError\] = useState\(null\); 

const \[isPending, startTransition\] = useTransition\(\); 

4

function handleSubmit\(\) \{

startTransition\(async \(\) => \{

const errorMsg = await updateNameAPI\(name\); 

if \(errorMsg\) \{

setError\(errorMsg\); 

return; 

\}

redirect\('/profile'\); 

\}\); 

\}

return \(

<button onClick=\{handleSubmit\} disabled=\{isPending\}>Update Name</button> 

\); 

\}

Here, isPending is automatically managed by React during the transition. The React docs note that using useTransition simplifies handling of async updates \(pending state, optimistic UI, error boundaries\) 29 . 

Building on this, React 19 adds a new hook React.useActionState , which combines useTransition with state and form handlers, and a <form action=\{func\}> mechanism for automatic form submissions \(using “actions”\). In practice, you can now attach an async function directly to a form’s action prop, and React will handle the submission as an action. For instance 30 : function ChangeName\(\) \{

const \[error, submitAction, isPending\] = useActionState\(

async \(prevState, formData\) => \{

const newName = formData.get\("name"\); 

const errorMsg = await updateNameAPI\(newName\); 

if \(errorMsg\) return errorMsg; 

return null; 

\}

\); 

return \(

<form action=\{submitAction\}> 

<input name="name" defaultValue="Alice" /> 

<button type="submit" disabled=\{isPending\}>Change Name</button> 

\{error && <p className="error">\{error\}</p>\}

</form> 

\); 

\}

Here, useActionState provides isPending and error automatically as the action runs. Forms now support async action functions out of the box, reducing boilerplate for optimistic UI and error handling. 

5

**Optimistic Updates \( useOptimistic \)**

React 19 introduces a new hook useOptimistic to manage optimistic UI updates 31 . This lets you update the UI immediately while an async request is in flight, and automatically revert if the request fails. 

For example:

function ChangeName\(\{currentName, onUpdate\}\) \{

// Optimistically show currentName immediately

const \[optimisticName, setOptimisticName\] = useOptimistic\(currentName\); 

const submitAction = async formData => \{

const newName = formData.get\("name"\); 

setOptimisticName\(newName\); 

// Update UI optimistically

const updatedName = await updateNameAPI\(newName\); 

onUpdate\(updatedName\); 

\}; 

return \(

<form action=\{submitAction\}> 

<p>Your name is: \{optimisticName\}</p> 

<input type="text" name="name" defaultValue=\{currentName\} /> 

<button type="submit">Submit</button> 

</form> 

\); 

\}

While the request runs, the UI shows optimisticName . Once it completes, React reconciles and shows the real currentName from props. The official docs explain that useOptimistic “will immediately render the optimistic value while the update is in progress, then revert to the real value” 32 33 . 

**New Hooks: useFormStatus , use , and Others**

• **useFormStatus \(ReactDOM\):** A new hook to read the status of the nearest parent <form> . It returns \{ pending \} , letting you, for example, disable a submit button automatically when the form is submitting 34 . Example: import \{ useFormStatus \} from 'react-dom'; 

function SubmitButton\(\) \{

const \{ pending \} = useFormStatus\(\); 

return <button type="submit" disabled=\{pending\}>Submit</button>; 

\}

6

This hook treats the form as a provider for status flags, simplifying design-system components’ interaction with forms 34 . 

• **use \(resource reading\):** React 19 introduces the use hook to *suspend* on promises or read context conditionally. For example:

import \{ use \} from 'react'; 

function Comments\(\{commentsPromise\}\) \{

// Suspends until commentsPromise resolves

const comments = use\(commentsPromise\); 

return comments.map\(c => <p key=\{c.id\}>\{c.text\}</p>\); 

\}

Wrapping this in <Suspense> allows streaming the resolved data. Note: calling use on a promise created during render is disallowed 35  \(you must use a cached promise or resource\). 

**Ref and Context Updates**

React 19 simplifies some patterns:

**Refs as pr**

• 

**ops:** Function components can now declare a ref prop directly, eliminating the need for forwardRef . For example:

function MyInput\(\{ placeholder, ref \}\) \{

return <input placeholder=\{placeholder\} ref=\{ref\} />; 

\}

<MyInput ref=\{someRef\} /> 

New components can just use the ref prop directly, and React will codemod forwardRef away in your code 36 . 

• **<Context> as Provider:** You can now render <MyContext value=\{...\}> instead of

<MyContext.Provider> . Internally React treats <Context> as the provider component 37 . 

**Ref**

• 

**cleanup: **ref callbacks may return a cleanup function. When a component unmounts, React will call this cleanup, similar to effect cleanups 38 . Previously refs were set to null on unmount; now the cleanup functions replace that. This enhances control over ref lifecycles. 

**Server Components and SSR**

React 19 includes all previous React Server Components \(RSC\) features \(stable for RSC users\) 39 . Key ReactDOM changes for SSR/SSG include new “static” APIs that wait for data. The react-dom/static entrypoint exports two new methods: prerender\(\) and prerenderToNodeStream\(\) 40 . These 7

functions render a React tree to static HTML **after awaiting all data** \(unlike renderToString \). For example:

import \{ prerender \} from 'react-dom/static'; 

async function handler\(req\) \{

const \{ prelude \} = await prerender\(<App />, \{ bootstrapScripts: \['/

main.js'\] \}\); 

return new Response\(prelude, \{ headers: \{ 'content-type': 'text/html' \} \}\); 

\}

This ensures all async data is resolved before sending HTML, which is crucial for correct SSG output 41 . The new APIs **do not stream partial results**; they produce fully-rendered static HTML. For streaming SSR use the existing ReactDOM streaming APIs instead 42 . 

Hydration mismatches are better reported in React 19: instead of multiple warnings, React now logs a single diff explaining the mismatch and automatically retries client render if needed 43 44 . This makes debugging SSR hydration much clearer. 

**Known Issues**

**Compatibility:**

• 

Since React 19 introduces new compile-time hooks, ensure frameworks and tooling support the use hook and new server/SSR APIs. Some bundlers may need to pin to a specific React version \(React 19 is stable but underlying RSC bundler APIs may change\) 45 . 

**Forwar**

• 

**dRef deprecation:** The use of forwardRef will be phased out; use the new ref-prop pattern. Mixed old/new patterns may cause inconsistent typing until upgraded. 

**Actions API Maturity:**

• 

Many async features are new; if you mix React 19 and older libraries \(like form libraries\), test thoroughly. Use the React 19 upgrade guide if encountering issues. 

**React Dropzone 14.3.8**

**React Dropzone** is a popular library for drag-and-drop file uploads. Version **14.3.8 \(Feb 2025\)** is a patch release that makes the library compatible with the latest React and browser file APIs. Notable changes: **T**

• **ypeScript and React 19 compatibility:** Dropzone’s TypeScript types were updated for React 19. In a prior release \(14.3.6\), the JSX type import was fixed to be compatible with React 19 46 . In 14.3.8

specifically, the event type for drops was extended. 

**FileSystemFileHandle support:**

• 

Modern browsers \(Chrome, Edge\) support dragging files and

folders using the File System Access API. Dropzone’s drop event now includes FileSystemFileHandle entries. Version 14.3.8 “updates drop event type to include FileSystemFileHandle ” 47 . This means in TypeScript, onDrop callbacks can now receive FileSystemFileHandle objects \(e.g., when dragging folders in Chromium\). 

Below is a basic usage example of useDropzone :

8

import \{ useDropzone \} from 'react-dropzone'; 

function FileUploader\(\) \{

const \{ getRootProps, getInputProps \} = useDropzone\(\{

onDrop: \(acceptedFiles\) => \{

console.log\('Dropped files or handles:', acceptedFiles\); 

// acceptedFiles may now include FileSystemFileHandle objects

\}

\}\); 

return \(

<div \{...getRootProps\(\)\} style=\{\{ border: '2px dashed \#888', padding:

'20px' \}\}> 

<input \{...getInputProps\(\)\} /> 

<p>Drag & drop files here, or click to select files.</p> 

</div> 

\); 

\}

In this example, dragging files or directories into the zone yields acceptedFiles , which can include both File objects and FileSystemFileHandle \(for directories\). The new types in 14.3.8 ensure no TypeScript errors for these handles 47 . 

**Caveats and Tips**

**Native Dir**

• 

**ectory Upload:** To enable dropping folders, you may also need webkitdirectory or directory attributes. React Dropzone itself passes through these browser capabilities. 

**Event typings:**

• 

If using TypeScript, upgrade to 14.3.8\+ so that onDrop event handlers recognize FileSystemFileHandle . Older versions would type errors on folder drag events. 

**Kno**

• 

**wn issues:** Aside from this fix, no new bugs were reported in 14.3.8. Earlier 14.x releases had minor issues \(e.g. fixes for wrong file type messages in 14.3.5\), but 14.3.8 mainly ensures compatibility and bug fixes for the latest environment. 

**Usage Note:** React Dropzone is a Client Component. Do not use it in Next.js Server Components – always put drag-and-drop file inputs in client-rendered components \(add 'use client' if using the App Router\). 

**References:** The React Dropzone 14.3.8 release notes document the bug fix for event types 47 . For full API and examples, see the official docs. 

1

2

3

5

6

7

8

16

18

19

20

21

22

23

24

25

26 Next.js 15 | Next.js

https://nextjs.org/blog/next-15

4

13

14

15 Next.js 15.3 | Next.js

https://nextjs.org/blog/next-15-3

9

9

10 App Router: Streaming | Next.js

https://nextjs.org/learn/dashboard-app/streaming

11

12 Guides: Lazy Loading | Next.js

https://nextjs.org/docs/pages/guides/lazy-loading

17 Soft 404 on Dynamic routes \(Googlebot indexing\) · Issue \#79942 · vercel/next.js · GitHub

https://github.com/vercel/next.js/issues/79942

27

28

29

30

31

32

33

34

35

36

37

38

39

40

41

42

43

44

45 React v19 – React

https://react.dev/blog/2024/12/05/react-19

46

47 Releases · react-dropzone/react-dropzone · GitHub

https://github.com/react-dropzone/react-dropzone/releases

10


# Document Outline

+ Next.js 15.4.0-canary.56  
	+ Rendering, Streaming, and Lazy Loading  
		+ Code-Splitting and Streaming Example 

	+ Performance Optimizations 
	+ Routing and Server-Side Rendering 
	+ Server Hooks and Background Tasks 
	+ Enhanced Forms \(next/form\) 
	+ Known Issues 

+ React 19.0.0 & ReactDOM 19.0.0  
	+ Concurrent Features and “Actions”  
	+ Optimistic Updates \(useOptimistic\) 
	+ New Hooks: useFormStatus, use, and Others 
	+ Ref and Context Updates 
	+ Server Components and SSR 
	+ Known Issues 

+ React Dropzone 14.3.8  
	+ Caveats and Tips



