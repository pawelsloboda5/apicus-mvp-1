**IndexedDB in React 19 / Next.js 15**

IndexedDB is the browser’s built-in API for **client-side storage of large, structured data **1

2 . Unlike simple key/value stores \(like localStorage\), IndexedDB supports complex objects, indexes, and rich queries, enabling offline-capable and high-performance web apps. Data stored in IndexedDB persists across page loads and even when offline, making it ideal for caching, offline work, and large datasets 2 . A common approach is to use a wrapper like **Dexie.js**, which provides a Promise-based API and React hooks for IndexedDB, simplifying schema definitions and queries 1

3 . \(For example, the Apicus project defines its Dexie database as shown below.\) All IndexedDB operations are asynchronous; they use events or Promises and generally return a request object that resolves with a result \(an IDBDatabase , records, etc.\) 4 . 

**Scope & Security:**

• 

IndexedDB is scoped to the web origin \(protocol \+ host \+ port\). Only pages from

the same origin can access the same database, and data is not shared between domains. In private/

incognito modes, stored data is typically kept only in-memory and cleared on exit 5 . Because IndexedDB is accessible via JavaScript, it is subject to the same security model and XSS risks as other client-side storage; avoid storing secrets there. It is generally considered safe for most structured data, but do not assume it is encrypted or inaccessible to malicious scripts running on the same origin. 

**Br**

• **owser Support:** IndexedDB is widely supported in modern browsers \(Chrome, Firefox, Edge, Safari, etc.\). It has been part of HTML5 standards for years. Each browser imposes its own storage quotas \(often hundreds of MB or more, sometimes per-origin or per-device quota\) 6 . Users may be prompted to allow storage on first use, and quotas may be per-origin or total \(see browser docs\). 

**API Structure and Design**

IndexedDB is structured around a few key concepts: **Databases**, **Object Stores**, **Indexes**, **Keys**, and **Transactions**. Think of a database as containing multiple “tables” \(object stores\) that hold records; each record has a key \(its unique identifier\) and a value \(a JavaScript object\). To use IndexedDB, you typically follow this pattern 7

4 : 1. **Open a database:** Use indexedDB.open\(name, version\) to get an IDBOpenDBRequest . 

2. **\(If first time or version change\) Define schema:** In the onupgradeneeded handler, use db.createObjectStore\(\) and store.createIndex\(\) to set up object stores and indexes 8

3 . 

3. **Start a transaction:** Call db.transaction\(storeNames, mode\) to get an IDBTransaction . 

Specify the object stores and "readonly" or "readwrite" mode 9 10 . 

4. **Perform operations:** From the transaction, get each object store via 

transaction.objectStore\(name\) . Then use methods like add\(\) , get\(\) , put\(\) , 

delete\(\) , and cursor operations to read/write data 11 12 . 

5. **Handle completion:** These operations are async: you listen for success/error events on the request, or in modern usage you await Promises \(e.g. via Dexie\). A transaction stays active while there are pending requests, and it commits when all finish or aborts on error 13 14 . 

1

**Example – Creating a database and object store:** Raw IndexedDB requires an open request and upgrade handler. For instance:

const request = indexedDB.open\("MyDB", 1\); 

request.onupgradeneeded = \(event\) => \{

const db = event.target.result; 

// Create an object store "projects" with auto-incrementing numeric key

db.createObjectStore\("projects", \{ keyPath: "id", autoIncrement: true \}\); 

\}; 

8  The code above defines a new database \(or opens it\) and creates an object store named "projects". In this store, each record’s key will be taken from its id property \(auto-generating numeric IDs\). In the Dexie.js wrapper \(used in this project\), schema is defined declaratively instead:

import Dexie from 'dexie'; 

const db = new Dexie\("MyDB"\); 

db.version\(1\).stores\(\{

projects: '\+\+id, name, category' 

// \+\+id = autoincrement key; name, category 

= indexed fields

\}\); 

15

3  In the Dexie schema string, \+\+id denotes an auto-increment primary key, and following fields \(e.g. name, category \) become indexed properties for queries 3 . To upgrade the schema in Dexie, simply bump the version and call .stores\(\{ … \}\) again; Dexie then handles the onupgradeneeded logic and migration internally. 

**Transactions:** All reads/writes occur in a transaction. In raw IndexedDB, you do: 

const tx = db.transaction\(\["projects"\], "readwrite"\); 

const store = tx.objectStore\("projects"\); 

store.add\(\{ name: "Project X", category: "AI" \}\); 

This returns a request you can await or listen to. Dexie simplifies this: you can call methods directly on db.table , and Dexie batches them in implicit transactions 16 . For example: 

// Dexie: add or update records

await db.projects.add\(\{ name: "Project X", category: "AI", roi: 42 \}\); 

await db.projects.put\(\{ id: 5, name: "Updated Project", roi: 50 \}\); 

17 . To query data: 2

const project = await db.projects.get\(5\); 

// get by primary key

const aiProjects = await db.projects.where\('category'\).equals\('AI'\).toArray\(\); 

18 . Delete is similarly easy \( await db.projects.delete\(id\) \). All Dexie methods return Promises \(since IndexedDB is async\) 16 ; wrap in try/catch to handle quota or constraint errors. 

**Indexes:** You can add indexes to object stores for quick lookup. In Dexie schema strings, just list fields after the key \(e.g. projects: '\+\+id, name, category' creates secondary indexes on name and category

3 . In raw API, you would call objectStore.createIndex\("byName", "name"\) in onupgradeneeded . IndexedDB also supports unique indexes \(prefix with & in Dexie\) or compound indexes \( \[fieldA\+fieldB\] in Dexie\) 3 . 

**Common Operations**

**Opening a database:**

• 

In Dexie, instantiate once \(e.g. in a module\): const db = new 

Dexie\("ApicusDB"\); db.version\(1\).stores\(\{ scenarios: '\+\+id, slug', nodes: '\+

\+id, scenarioId', edges: '\+\+id, scenarioId' \}\); 19 . In raw API, use indexedDB.open\(name, version\) and handle events. Remember that open\(\) returns

immediately with an IDBOpenDBRequest , and you must use onsuccess / onerror callbacks \(or Promises\) to know when the DB is ready 4 . 

**Cr**

• **eating object stores \(tables\):** Handled in the upgrade phase. Dexie’s .stores\(\) call automatically creates stores if new, or upgrades existing store definitions if the version changed 3 . 

In raw code, use db.createObjectStore\("storeName", options\) inside onupgradeneeded

8 . For example, to add a “customers” store with auto increment: const store = 

db.createObjectStore\("customers", \{ autoIncrement: true \}\); . 

**T**

• **ransactions:** Specify which stores and mode. E.g. raw: const tx = 

db.transaction\(\["scenarios"\], "readwrite"\); const store = 

tx.objectStore\("scenarios"\); store.add\(\{ /\*...\*/ \}\); 10 . In Dexie, most operations \(like add , update , delete \) automatically run in a new transaction, so you rarely call db.transaction\(\) yourself. However, Dexie also supports explicit transactions: e.g. await db.transaction\('rw', db.projects, db.customers, async \(\) => \{ /\* multi-step 

work \*/ \}\); 16 . 

**Adding data:**

• 

Dexie: db.table.add\(obj\) returns the new key 17 . Raw: use objectStore.add\(\) . 

**Updating data:**

• 

Dexie: db.table.put\(obj\) replaces or inserts 17 ; or db.table.update\(key, changes\) . Raw: open a readwrite transaction, store.put\(obj\)

which works like add/update. 

**Querying data:**

• 

Dexie simplifies queries. You can do await db.table.get\(key\) for a single

record by primary key 18 , or use indexed queries: await db.table.where\('field'\).equals\(value\).toArray\(\) to get all matching records 18 . It supports range queries \( above\(\) , below\(\) , etc.\) and compound filters. In raw API, you’d use cursors or indexes \( store.get\(key\) , store.index\("byCategory"\).getAll\("Finance"\) , etc.\). 

**Deleting data:**

• 

Dexie: await db.table.delete\(key\) removes a record 18 . Raw: objectStore.delete\(key\) . Use store.clear\(\) to empty an object store in one go. 

3

**Live Queries:** Dexie offers the dexie-react-hooks useLiveQuery hook to integrate seamlessly with React. It tracks database changes and re-runs queries automatically. For example:

import \{ useLiveQuery \} from 'dexie-react-hooks'; 

import \{ db \} from './db'; 

// your Dexie instance

function HighROIProjects\(\) \{

const highROI = useLiveQuery\(

\(\) => db.projects.where\('roi'\).above\(50\).toArray\(\), 

\[\]

// dependencies

\); 

if \(\!highROI\) return <p>Loading...</p>; 

return \(

<ul>\{highROI.map\(p => <li key=\{p.id\}>\{p.name\}: ROI \{p.roi\}%</li>\)\}</ul> 

\); 

\}

This hook returns undefined initially \(loading\), then the query result array 20 . Importantly, **any** changes made via Dexie \(add/update/delete on projects \) cause the hook to re-run and update the UI automatically 21 . This effectively makes IndexedDB a *reactive state store* for React components 21 . \(Note: for this to work, the component must run on the client; Dexie calls should not be used in server components or during SSR.\) 

**Helper Hook Example:**

• 

In our project, we defined a hook to fetch a single scenario by ID:

import \{ useLiveQuery \} from 'dexie-react-hooks'; 

import \{ db \} from './db'; 

export function useScenario\(id?: number\) \{

return useLiveQuery\(\(\) => \(id ? db.scenarios.get\(id\) : undefined\), \[id\]\); 

\}

This returns the Scenario object \(or undefined \) and updates reactively when the database changes 22 . 

**React & Next.js Integration**

When using IndexedDB in a Next.js 15 \(App Router\) \+ React 19 environment, remember that **IndexedDB**

**only exists in the browser**. All IndexedDB/Dexie code must run in client components or effects \( "use client" components\) and never in server components or API routes. In practice, you would initialize your Dexie database in a shared module \(imported by client code\) so there is a single instance 23 . For example, putting export const db = new ApicusDB\(\); in lib/db.ts ensures it’s reused. Only import/use Dexie in components marked "use client" or inside useEffect to avoid SSR errors. 

**Best Practices in React:** Use Dexie’s React hooks and Context to keep code clean. Create one Dexie instance and import it where needed – do not open multiple instances of the same database 23 . Handle 4

loading states: since queries return Promises, your hook/component will see undefined until the first result arrives 24 . Show a spinner or placeholder during that time. Always catch errors on database calls \(quota issues, upgrade failures\) and present fallback UI if needed 25 . Be careful with component unmounts \(cancel subscriptions or ignore stale results if the component unmounts during a query\). 

In React 19, server components can now await data and stream results, but **IndexedDB must still be** **accessed on the client side**. If you need to fetch or pre-render data on the server, do it from your backend API or database – you cannot use IndexedDB on the server. One approach is to use a React Context or custom hook to expose Dexie data to client components. For example, you might populate some data in Dexie on the client and then share it via Context to the rest of the UI 26 . 

**State Management:** Because useLiveQuery already keeps your UI in sync with the DB, you often don’t need additional state. However, you can combine Dexie with React Context or other state libraries: e.g. a context provider could run a common query with useLiveQuery and supply that data to any descendant, rather than having each component re-run the query separately 26 . 

**Code Examples \(TypeScript\)**

Below are illustrative code snippets showing common patterns in this environment. 

**Define the database schema \(De**

• 

**xie, TypeScript\):**

import Dexie from 'dexie'; 

export interface Project \{ id?: number; name: string; category: string; 

roi?: number; \}

const db = new Dexie\('MyAppDB'\); 

db.version\(1\).stores\(\{

projects: '\+\+id, name, category' 

// \+\+id = auto-increment primary key

\}\); 

export default db; 

This creates a Dexie DB named "MyAppDB" with one table "projects" . Dexie infers types from the interface if used in code, helping with TypeScript. \(We export the db instance for reuse.\) 15 3

**Adding a r**

• 

**ecord:**

// Add a new project

await db.projects.add\(\{ name: "Project Alpha", category: "Engineering", roi: 20 \}\); 

This returns a Promise resolving to the new record’s ID 17 . 

**Querying r**

• 

**ecords:**

5

// Get by primary key

const project = await db.projects.get\(5\); 

// Query by index

const engProjects = await db.projects

.where\('category'\).equals\('Engineering'\).toArray\(\); 

Both return Promises. Dexie supports chaining filters and range queries for complex searches 18 . 

**T**

• **ransactional work \(Dexie\):**

// Example of a multi-table transaction

await db.transaction\('rw', db.projects, db.otherStore, async \(\) => \{

await db.projects.put\(\{ id: 5, name: "Updated" \}\); 

await db.otherStore.add\(\{ projectId: 5, detail: "Notes" \}\); 

\}\); 

In this block, both tables are updated atomically. Dexie ensures rollback on error 16 . 

**React Hook \(useLiveQuery\):**

• 

import \{ useLiveQuery \} from 'dexie-react-hooks'; 

import db from '../lib/db'; 

// the Dexie instance

function ScenarioList\(\) \{

const scenarios = useLiveQuery\(\(\) => db.scenarios.toArray\(\), \[\]\); 

if \(\!scenarios\) return <p>Loading...</p>; 

return \(

<ul> 

\{scenarios.map\(s => <li key=\{s.id\}>\{s.name\}</li>\)\}

</ul> 

\); 

\}

Here, ScenarioList will rerender whenever the scenarios table changes, thanks to 

useLiveQuery 20 21 . 

**Custom Hook:**

• 

// Hook to fetch a scenario by ID \(as shown earlier\)

export function useScenario\(id?: number\) \{

return useLiveQuery\(\(\) => \(id ? db.scenarios.get\(id\) : undefined\), \[id\]\); 

\}

6

Use this inside a React component to get live-updating data for one record 22 . 

**Best Practices and Pitfalls**

**Single DB Instance:**

• 

Create and export one Dexie instance \(e.g. export const db = new 

ApicusDB\(\); \) and import it wherever needed. This ensures all parts of your app share the same connection and cache 23 . Don’t create multiple instances for the same database. 

**Handle Async and Lifecycles:**

• 

All queries are async. Components should guard against 

undefined results until data arrives \(e.g. show a loading UI\) 24 . Also, cancel or ignore results if a component unmounts mid-query to avoid memory leaks. Dexie’s hooks automatically track

dependencies, but if you use plain Promises, you’ll need to manage cleanup. 

**Err**

• 

**or Handling:** Wrap database calls in try/catch or use .catch\(\) . Common errors include storage quota exceeded or version mismatch. For instance, catching a VersionError when

opening a DB with a lower version than exists, or handling QuotaExceededError if storage limits are hit 25 . Show an error message or fallback UI if operations fail. 

**V**

• **ersion Upgrades:** When changing the schema \(adding/removing stores or indexes\), increment the database version. In Dexie, bump db.version\(n\) and call .stores\(\) again; Dexie runs the upgrade callback for you 27 . Test upgrades carefully on existing data to avoid data loss. In raw IndexedDB, remember you must handle onupgradeneeded and possibly migrate old data. 

**T**

• **ransaction Limits:** Browsers limit transaction duration. Don’t keep transactions open indefinitely. 

For batch operations \(e.g. importing thousands of records\), use Dexie’s bulkAdd / bulkPut or break work into smaller chunks to avoid locking up the UI 28 . 

**Do Not Rely on Unload:**

• 

Do **not** start a transaction on window unload hoping it will finish – it will be

aborted if the page closes 29 . For example, if you clear a store in one transaction and write new data in another, a browser shutdown could happen in between, leading to data loss. Combine

related operations into a single transaction whenever possible 29 . 

**Quota Consider**

• 

**ation:** If the database grows large, users may be prompted for extra space or the

write may fail. Consider letting users know if data can’t be saved \(e.g. show “Storage is full” if a write is rejected\). 

**Performance Considerations**

IndexedDB operations are generally fast, but since they run on the main thread, **avoid very heavy queries** **or millions of records** at once. Use indexes to speed up searches. For large inserts/updates, prefer bulk APIs: Dexie’s bulkAdd\(\) and bulkPut\(\) can insert many records more efficiently than looping individual add\(\) calls 28 . Also consider offloading big data processing to a Web Worker and using IndexedDB inside the worker \(Dexie can run in workers\) to prevent UI freezes. Keep transactions short and only include necessary object stores to allow parallelism 30 . 

In React, React 19’s concurrent rendering helps keep UI responsive, but long database ops can still block renders. Use useLiveQuery or async calls inside effects so that React can suspend or show fallback UI until data is ready 20 31 . 

7

**Limitations and Security**

**Stor**

• 

**age Limits:** Browsers impose quotas \(often a percentage of disk or fixed MB\). If you exceed the quota, writes fail \(throw an error\). There’s no standard cross-browser quota; check documentation. 

Regularly check for QuotaExceededError when writing large blobs or many records. 

**No Cr**

• 

**oss-Origin Access:** Data is tied to the origin. You cannot access an IndexedDB created on another domain or subdomain. 

**Privacy/Incognito:**

• 

Data in private mode is usually ephemeral. Chrome and Firefox typically keep it

in-memory only; closing the browser erases it 5 . 

**Security:**

• 

IndexedDB respects the same-origin policy, but **data is not encrypted**. Treat it as public storage for your origin. Malicious scripts running on your page \(via XSS\) could read or corrupt the data. Do **not** store sensitive secrets \(passwords, tokens\) in IndexedDB. Follow normal web security best practices \(CSP, input sanitization, etc.\) to protect client-side storage. 

**Br**

• **owser Bugs:** Some older browser versions had quirks \(e.g. silent aborts on close\). Modern browsers emit a close event on the database if the page is closed during a write 29 . Ensure critical updates are in single transactions so they won’t be lost on unexpected closure. 

By following these guidelines and patterns, you can reliably use IndexedDB \(via Dexie\) within a React 19 /

Next.js 15 application. Use Dexie’s schema definitions and live queries to keep your code clean, and handle the asynchronous nature of the API carefully. The result is a **persistent, offline-capable client datastore** that integrates seamlessly with React components 21 26 . 

**Sources:** Official MDN IndexedDB documentation and Dexie.js patterns 2

4

3

20

32 , along with project-specific Dexie usage in Apicus \(see lib/db.ts \) 19 22 . 

1

3

11

15

16

17

18

20

21

23

24

25

26

27

28

31

32 tech-stack.md

https://github.com/pawelsloboda5/apicus-mvp-1/blob/9bfa6dbc442b7d94e855c6f811e684b771c655a7/docs/tech-stack.md

2

4

5

6

7

8

9

10

12

13

14

29

30 index.md

https://github.com/mdn/content/blob/3e543cdfe8dddfb4774a64bf3decdcbab42a4111/files/en-us/web/api/indexeddb\_api/

using\_indexeddb/index.md

19

22 db.ts

https://github.com/pawelsloboda5/apicus-mvp-1/blob/9bfa6dbc442b7d94e855c6f811e684b771c655a7/lib/db.ts

8


# Document Outline

+ IndexedDB in React 19 / Next.js 15  
	+ API Structure and Design 
	+ Common Operations 
	+ React & Next.js Integration 
	+ Code Examples \(TypeScript\) 
	+ Best Practices and Pitfalls 
	+ Performance Considerations 
	+ Limitations and Security



