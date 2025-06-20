**React 19.0.0 and ReactDOM 19.0.0: Features and**

**Changes**

React 19 introduces many new capabilities and performance improvements, but also removes legacy APIs. 

Key new features include a first-class **Actions/Transitions** system \(for async updates\), *Server Components*, enhanced **Suspense**, and several new Hooks \(e.g. useOptimistic , useFormStatus , useActionState , and the new use resource hook\) 1

2 . ReactDOM adds new static rendering APIs \( prerender , prerenderToNodeStream \) that await data before producing HTML 3 . 

Notable improvements for performance and reliability include: **faster Suspense fallbacks** \(React 19

immediately shows a fallback on the first suspended tree and then pre-warms siblings\) 4

5 ; **better** **hydration** \(third-party scripts or unexpected tags in <head> / <body> are skipped to avoid mismatches\)

6 ; **enhanced error handling** \(errors no longer double-log and new root options onCaughtError /

onUncaughtError are provided\) 7 ; full **Custom Elements support** \(props on custom elements are now assigned as properties on the client and as attributes on the server\) 8 ; and several **Strict Mode** fixes \(memoized results are reused on double-render, ref callbacks are double-invoked, etc.\) 9 . React 19 also *drops UMD builds* \(recommends using an ESM CDN like esm.sh\) 10 . 

On the other hand, React 19 removes many deprecated APIs. For example, propTypes and defaultProps on function components have been removed \(migrating to TypeScript or ES6 defaults is recommended\) 11 . Legacy context \( contextTypes / getChildContext \), string refs, module-pattern component factories, createFactory , and the shallow renderer have all been removed 12 13 14 15 . 

In ReactDOM, the old render , hydrate , and unmountComponentAtNode APIs are gone – you must now use createRoot / hydrateRoot and call .unmount\(\) on the root 16 17 18 . Also removed is findDOMNode . The new JSX transform \(introduced in React 17\) is **now required** in React 19 for features like ref-as-prop optimizations 19 . For a full list of breaking changes, see the React 19 Upgrade Guide \(no upgrade steps will be repeated here\) 20 16 . 

**Server Components**

React Server Components are now stable in React 19 21 . A Server Component runs on the server \(build-time or request-time\) and can import heavy modules or access server data without bundling them to the client. For example, a Server Component might read a Markdown file from disk and render it to HTML on the server:

// This code runs on the server \(outside the client bundle\)

import marked from 'marked'; 

import sanitizeHtml from 'sanitize-html'; 

async function Page\(\{ page \}\) \{

const content = await file.readFile\(\`$\{page\}.md\`\); // file I/O on server

1

return <div>\{sanitizeHtml\(marked\(content\)\)\}</div>; 

\}

The rendered HTML \(a simple <div> with the sanitized markdown\) is then shipped to the client without including marked or sanitize-html in the client bundle 22 23 . Server Components can run at build time \(to generate static HTML\) or on demand per request. In frameworks that support the “Full-stack React Architecture”, Server Components can even contain interactivity by streaming them into a client-rendered tree. Note: Server Components are declared via file location \(e.g. in a /server folder or with a designated extension\) rather than a special directive. For detailed guidance, see the React Server Components docs 24

23 . 

**Suspense in React 19**

React’s Suspense allows components to “suspend” while loading data or code, showing a fallback UI in the meantime. In React 19 this pattern has been refined. You wrap any lazy or data-fetching component in

<Suspense fallback=\{...\}> :

<Suspense fallback=\{<LoadingSpinner />\}> 

<Albums artistId=\{artist.id\} /> 

</Suspense> 

React will show the <LoadingSpinner /> until the <Albums> component \(and any of its children\) have finished loading 25 . React 19 specifically improves this by committing the fallback **immediately** when one child suspends, and then “pre-warming” the remaining children. This means fallbacks appear faster \(no waterfall waits\) while React continues to fetch lazy-loaded components in the background 4

5 . 

Suspense also integrates with streaming server rendering and selective hydration under the hood 26 . 

In practice, Suspense-based data fetching requires a framework or library. Typical usage is with React.lazy\(\) for code-splitting or with libraries like Relay/Next.js that support Suspense-enabled data fetching. For example, a simple code-split component:

const Comments = React.lazy\(\(\) => import\('./Comments'\)\); 

function Page\(\) \{

return \(

<Suspense fallback=\{<Loading />\}> 

<Comments postId=\{id\} /> 

</Suspense> 

\); 

\}

When <Comments> is still loading its JS, React 19 will immediately show <Loading /> , then render

<Comments> once the bundle arrives 27 . \(If <Comments> uses data fetching, it must use a Suspense-ready pattern; without a framework, data fetching in useEffect won’t trigger Suspense.\) 2

**Concurrent Updates \(Actions and Transitions\)**

Building on React 18’s concurrent rendering, React 19 introduces *Actions* and first-class support for async transitions. You can mark a state update as a non-blocking “Transition” by calling startTransition\(\) from the useTransition hook. The function passed into startTransition is now called an **Action**

28 . For example: function SubmitButton\(\{ onSubmit \}\) \{

const \[isPending, startTransition\] = useTransition\(\); 

return \(

<button

disabled=\{isPending\}

onClick=\{\(\) => \{

startTransition\(async \(\) => \{

await onSubmit\(\); 

\}\); 

\}\}

> 

Submit

</button> 

\); 

\}

Here, clicking the button starts an Action. React will process the update in the background, keeping the UI responsive. While the action is in-flight, isPending is true, allowing you to show a loading indicator. 

Importantly, if the user makes further updates \(e.g. clicking another button\), React will interleave work to keep the UI interactive 29 30 . 

React 19 takes this further with hooks like useActionState \(formerly useFormState \) that simplify this pattern 31 , and by integrating Actions into form elements. You can now pass a function directly to a

<form> ’s action prop, and React will submit it as an Action, automatically resetting the form on success

32 . A typical pattern is: const \[error, submitAction, isPending\] = useActionState\(async \(prevState, 

formData\) => \{

const err = await updateName\(formData.get\("name"\)\); 

if \(err\) return err; 

redirect\("/path"\); 

return null; 

\}, null\); 

return \(

<form action=\{submitAction\}> 

<input type="text" name="name" /> 

<button type="submit" disabled=\{isPending\}>Update</button> 

3

\{error && <p>\{error\}</p>\}

</form> 

\); 

This uses useActionState to manage pending and error state of the server-bound action 33 34 . 

Additionally, a new useFormStatus hook lets deeply nested form controls know the parent form’s state, e.g. disabling a submit button when any parent form is submitting 35 . 

Another related feature is the new useOptimistic hook 34 . This lets you display an “optimistic” UI update immediately while an async update is pending. For example:

function NameEditor\(\{ currentName, onNameChange \}\) \{

const \[optimisticName, setOptimisticName\] = useOptimistic\(currentName\); 

const handleSubmit = async \(formData\) => \{

const newName = formData.get\("name"\); 

setOptimisticName\(newName\); 

const saved = await saveName\(newName\); 

onNameChange\(saved\); 

\}; 

return \(

<form action=\{handleSubmit\}> 

<p>Your name: \{optimisticName\}</p> 

<input name="name" disabled=\{currentName \!== optimisticName\} /> 

<button type="submit">Save</button> 

</form> 

\); 

\}

Here, optimisticName updates immediately, and if the server rejects the change, React automatically reverts to currentName 34 . 

**Hooks and JSX Changes**

Beyond the new hooks above, React 19 adds or adjusts several hook behaviors. For example, use \(imported from React\) lets you read a promise or context inside render and have the component suspend automatically 36 . Example: import \{ use \} from 'react'; 

function Comments\(\{ promise \}\) \{

const comments = use\(promise\); // suspends until promise resolves

return comments.map\(c => <p key=\{c.id\}>\{c.text\}</p>\); 

\}

4

Also, as noted, React 19 requires the **new JSX transform** \(React 17\+ style\) for some optimizations 19 . This allows features like passing ref as a prop and faster JSX compilation. 

Finally, Strict Mode improvements mean hooks like useMemo and useCallback are double-invoked in dev mode without losing their memoized results 9 . This helps catch bugs earlier without changing production behavior. 

**Performance Best Practices**

**Code-Splitting & Lazy Loading**

• 

: Use React.lazy\(\) and <Suspense> to split large components

and libraries, ensuring users see UI immediately while code loads. React 19’s improvements to Suspense \(instant fallback \+ pre-warming\) make this more effective 4 . 

**Server Components**

• 

: Offload heavy logic \(file I/O, large libraries\) to Server Components so clients

download only the final HTML output 22 . 

**Resour**

• 

**ce Preloading**: Take advantage of the new ReactDOM static APIs and browser preloading. For static pages, use prerender\(\) so React waits for all data before generating HTML 3 . For dynamic navigations, use <link rel="preload"> or React 19’s <head> preconnect/prefetch APIs to warm up critical assets \(scripts, fonts\). 

**Avoid Extr**

• 

**a Renders**: Use React.memo , useMemo , and useCallback judiciously to prevent expensive re-renders. \(Note that with the new JSX transform, some of the old patterns for avoiding new props have changed.\) Be aware that React 19’s optimistic updates and transitions handle many cases of async updates, so you can often simplify state logic. 

**Err**

• 

**or and Hydration Diagnostics**: Take advantage of React 19’s clearer error logs \(only one combined error is logged\) 7 . When debugging hydration issues on SSR, note that unexpected script tags or DOM changes by extensions are now ignored 6 . You can also disable Strict Mode in development to avoid the double-rendering confusion when profiling. 

**Pr**

• **ofiling Tools**: Use React Profiler \(built into DevTools\) to identify bottlenecks. Remember to test in production mode. React 19’s internal changes \(like removing legacy APIs\) also mean you may need to update any profiling or test utilities that relied on internals. 

In general, treat React 19 as you would React 18 plus the new concurrent/action paradigms: favor asynchronous UI patterns \(transitions, Suspense\), load non-critical work off the main thread \(using Web Workers or offscreen DOM if needed\), and profile/render in production mode for accurate timing. 

**Using react-dropzone 14.3.8 with React 19**

The react-dropzone library provides a hooks-based API for drag-and-drop file uploads. Version 14.3.x of react-dropzone has been updated for React 19 compatibility – for example, v14.3.6 fixes JSX type issues for React 19, and v14.3.8 updates the drop event type to include FileSystemFileHandle 37 38 . 

To integrate it in a React 19 app, you typically use the useDropzone hook \(which requires React ≥16.8\)

39 . A minimal example: import React, \{useCallback\} from 'react'; 

import \{useDropzone\} from 'react-dropzone'; 

5

function MyDropzone\(\) \{

const onDrop = useCallback\(acceptedFiles => \{

// Handle the File objects from acceptedFiles

\}, \[\]\); 

const \{getRootProps, getInputProps, isDragActive\} = useDropzone\(\{onDrop\}\); 

return \(

<div \{...getRootProps\(\)\} style=\{\{border: '2px dashed \#ccc', padding:

'20px'\}\}> 

<input \{...getInputProps\(\)\} /> 

\{isDragActive

? <p>Drop files here…</p> 

: <p>Drag & drop some files here, or click to select</p> 

\}

</div> 

\); 

\}

Here we wrap a <div> with getRootProps\(\) and include a hidden <input> with getInputProps\(\) 39 . The onDrop callback \(often wrapped with useCallback \) receives an array of File objects. For each file, you can use the FileReader API \(or pass the file to an upload function\). If you want to read file contents client-side, remember to use FileReader as shown in the documentation 40 . 

For performance: call useCallback around onDrop so the hook isn’t recreated each render. You can also enable the modern File System Access API by passing useFsAccessApi: true to useDropzone

41 ; this uses showOpenFilePicker\(\) under the hood for native file dialogs \(note: requires a secure context and may not support directories on all browsers\) 42 . In practice, large file handling should be done in a background task or optimized \(e.g. limiting max file size, using streams\) since the upload and FileReader work can block if not managed carefully. 

Finally, react-dropzone also exports a <Dropzone> component wrapper if you prefer JSX form. But the hook is more flexible and lightweight. In summary, using react-dropzone in React 19 is straightforward: stick with the documented hooks API and ensure your code handles the async nature of file reading/

uploads. The library’s recent versions take advantage of React hooks and are fully compatible with React 19’s concurrent features 37 39 . 

**Sources:** Official React 19 release notes and upgrade guide 1 34 6

4 ; React 19 docs \(Server Components, Suspense, useTransition\) 22 25 28 ; and react-dropzone documentation/release notes 39

37 . 

1

2

3

6

7

8

21

31

32

33

34

35

36 React v19 – React

https://react.dev/blog/2024/12/05/react-19

4

5

9

10

11

12

13

14

15

16

17

18

19

20 React 19 Upgrade Guide – React

https://react.dev/blog/2024/04/25/react-19-upgrade-guide

6

22

23

24 Server Components – React

https://react.dev/reference/rsc/server-components

25

26

27 – React

https://react.dev/reference/react/Suspense

28

29

30 useTransition – React

https://react.dev/reference/react/useTransition

37

38 Releases · react-dropzone/react-dropzone · GitHub

https://github.com/react-dropzone/react-dropzone/releases

39

40

41

42 react-dropzone - npm

https://www.npmjs.com/package/react-dropzone

7


# Document Outline

+ React 19.0.0 and ReactDOM 19.0.0: Features and Changes  
	+ Server Components 
	+ Suspense in React 19 
	+ Concurrent Updates \(Actions and Transitions\) 
	+ Hooks and JSX Changes 
	+ Performance Best Practices 
	+ Using react-dropzone 14.3.8 with React 19



