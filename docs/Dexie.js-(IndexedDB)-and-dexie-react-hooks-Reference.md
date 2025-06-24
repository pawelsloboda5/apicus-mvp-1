**Dexie.js \(IndexedDB\) and dexie-react-hooks**

**Reference**

Dexie.js is a minimal IndexedDB wrapper providing a promise-based, reactive API. You define a database and schema via new Dexie\(\) and db.version\(n\).stores\(\{...\}\) . For example: import Dexie from 'dexie'; 

const db = new Dexie\("FriendDatabase"\); 

db.version\(1\).stores\(\{

friends: "\+

\+id,name,age" 

// \+\+id: auto-increment PK; name and age are indexed fields

\}\); 

db.open\(\); 

This initializes a database named **FriendDatabase** with a table friends . Only properties declared in stores \(like name, age \) become indexed; unlisted properties are still stored but not indexed 1 . The schema syntax uses special symbols: \+\+ for auto-PK, & for unique index, \* for **multi-entry** index, and

\[A\+B\] for **compound** index 2 . \(For example, tags: "\*tag" would create a multi-entry index on the tag array property, and \[firstName\+lastName\] creates a compound index on two fields 3

2 .\) Dexie automatically handles IndexedDB versioning: each call to db.version\(n\) increments the underlying IDB version. You can supply an upgrade callback to migrate data between versions. Dexie also provides robust error-handling: it rejects promises on errors and will automatically abort a transaction on any exception \(not just IDB errors\) 4

5 . 

**Advanced Queries and Indexing**

**Indexes and Querying:** Dexie’s query API is built on IndexedDB KeyRange.  You write queries on a table’s indexed



fields



\(including



the



primary



key\). 



Basic



queries



use

.where\(indexName\).equals\(value\) , .above\(x\) , .below\(y\) , .between\(lo,hi\) , etc. Dexie adds useful operators: 

**Case-insensitive and arr**

• 

**ay matching: **.equalsIgnoreCase\(\) , .startsWithIgnoreCase\(\) , and .equals\(\) on array-valued \(multi-entry\) indexes. For example, with a multi-entry index 

\*categories , querying db.books.where\('categories'\).equals\('sci-fi'\) returns all books having **"sci-fi" ** in their categories array 6 . Because multi-entry can yield duplicates \(if an item matches multiple keys\), use .distinct\(\) to remove duplicates 7 :

// Define multi-entry index on categories:

db.version\(1\).stores\(\{ books: "id,author,\*categories" \}\); 1

db.books.put\(\{ id: 1, author:"A", categories:\["sci-fi","thriller"\] \}\); 

// Query sci-fi books \(distinct removes duplicates\):

db.books

.where\('categories'\).equals\('sci-fi'\)

.distinct\(\)

.toArray\(\); 

Dexie supports all standard IndexedDB operators on multi-entry indexes \(e.g. 

.equals\(\) , .startsWith\(\) , etc.\), but because underlying IndexedDB doesn’t natively support a

“contains” operator, Dexie uses the same methods \(like .equals\(\) \) for semantic “contains” queries 6 . 

Note that *primary keys* and *compound indexes* cannot be multi-entry \(a limitation of IndexedDB\) 8 . 

**Compound inde**

• 

**xes:** To query on combinations of fields efficiently, declare a compound index in the schema, e.g. people: "\[firstName\+lastName\]" . This indexes the tuple \(firstName, lastName\) . You can then query it with either syntax: 

// Using compound index directly:

db.people.where\("\[firstName\+lastName\]"\).equals\(\['Foo','Bar'\]\).toArray\(\); 

// Or \(Dexie ≥2.0\) using an object query \(works regardless of compound-index support\):

db.people.where\(\{firstName: 'Foo', lastName: 'Bar'\}\).toArray\(\); 

Dexie uses native IndexedDB compound indexes when available, and falls back gracefully on browsers that lack them 9 10 . Compound queries make lookups much faster than scanning the whole table. 

**Logical OR and multi-ke**

• 

**y ANY queries:** Dexie extends IndexedDB with algorithms for multi-key queries. .anyOf\(a, b, c\) finds records whose index value is *any* of the given keys \(like SQL IN \) and returns a merged collection 11 . Example: 

// Find friends aged 20 or 30:

db.friends.where\('age'\).anyOf\(20, 30\).toArray\(\).then\(console.log\); 

To combine conditions on different fields, Dexie provides Collection.or\(\) . For example, to find friends named “Alice” **or** with shoeSize>40:

db.friends

.where\('name'\).equalsIgnoreCase\('Alice'\)

.or\('shoeSize'\).above\(40\)

.toArray\(\); 

2

Internally this runs parallel queries and merges results \(dropping duplicates\). Note the sort order is then undefined; if you need a specific order, follow up with .sortBy\(\) 12 . In the example above, we might chain .sortBy\('shoeSize'\) to have a consistent order 13 14 . 

**Other query methods:**

• 

Dexie’s Table and Collection classes offer many convenient methods. 

Some highlights:

• .toArray\(\) converts a collection to an array of objects \(resolving the query promise\). 

• .count\(\) returns the number of matching records. 

• .filter\(fn\) \(alias .and\(fn\) \) lets you apply a JavaScript predicate to each object in the collection. **Use it sparingly**, as it iterates records in JS \(potentially slow for large tables\) 15 . Prefer indexed queries \( where / equals / anyOf \) whenever possible. 

• .modify\(updates\) applies an in-place update function to each object in a collection. Unlike update\(\) , modify\(\) can change multiple fields or add/remove fields in one transaction. 

• .reverse\(\) , .limit\(n\) , .offset\(n\) etc. limit or adjust the result set. 

**Code Example:** Advanced query usage:

// Assume db.friends has indexes on name, age, tags array. 

async function exampleQueries\(\) \{

// 1. Case-insensitive search on name with compound OR:

const result = await db.friends

.where\('name'\).equalsIgnoreCase\('david'\)

.or\('shoeSize'\).above\(40\)

.sortBy\('shoeSize'\); 

// sort explicitly after OR

console.log\(result\); 

// 2. Multi-entry query with ANY and DISTINCT:

const sciFiBooks = await db.books

.where\('categories'\).anyOf\('sci-fi', 'romance'\)

.distinct\(\)

.toArray\(\); 

console.log\(sciFiBooks\); 

// 3. Compound index lookup:

// \(Assuming db.people schema has \[firstName\+lastName\] index\)

const fooBar = await db.people

.where\('\[firstName\+lastName\]'\)

.equals\(\['Foo','Bar'\]\)

.first\(\); 

console.log\(fooBar\); 

\}

These examples illustrate Dexie’s rich query support for efficient data access without resorting to manual cursor loops or full table scans. 

3

**Transactions and Error Handling**

Dexie makes transactions easier and safer than raw IndexedDB. All operations inside db.transaction\(...\) run in a single atomic transaction. For example: db.transaction\('rw', db.friends, db.pets, \(\) => \{

db.friends.add\(\{name: 'Ann', age: 30\}\); 

db.pets.add\(\{name: 'Fido', ownerName: 'Ann'\}\); 

// ... 

\}\).then\(\(\) => \{

console.log\('Transaction committed.'\); 

\}\).catch\(error => \{

console.error\('Transaction failed:', error\); 

\}\); 

Key points about Dexie transactions and errors:

**Automatic**

• 

**rollback on errors:** If *any* exception or failed promise occurs inside the transaction callback, Dexie aborts the entire transaction and rejects its promise 5 . This ensures atomicity: either all writes succeed or none are applied. \(In fact, catching an error *inside* a transaction handler without re-throwing it will cause the transaction to commit unexpectedly 16 , so in a transaction scope you should generally let errors bubble out to the outer promise.\) The Dexie best-practices guide notes that transactions give *“Robustness: If any error occur, transaction will be rolled back\!” *5 . 

**Synchr**

• 

**onous-seeming style:** Inside a db.transaction\(..., \(\) => \{ ... \}\) callback, you can perform sequential DB operations without worrying about awaiting each promise. Dexie queues them correctly. For example, the code above adds friends then pets; you don’t need nested await or .then\(\) . \(Dexie also supports returning a promise at the end to signal a result, as in the code example above where we return the final query promise.\) This often makes the code shorter and clearer. As the guide notes, using transactions *“optimizes your code… non-transactional operations also* *use a transaction but it is only used in the single operation” *, so grouping operations can even be more efficient 17 . 

**T**

• **ransaction mode:** The first argument 'rw' means read-write; use 'r' for read-only transactions. You can include multiple tables or even more than 2 tables in one transaction. Dexie also supports calling db.transaction\(\) with an async function or with promises inside \(using async/await inside the callback is fine\). 

**Err**

• 

**or types:** 

Dexie defines specific error classes \(e.g. 

Dexie.AbortError , 

Dexie.ConstraintError , Dexie.DataError , etc.\) that are subclasses of JavaScript Error . 

When an operation fails \(e.g. a unique constraint violation on an indexed property\), Dexie throws an appropriate error \(promise rejection\). You can catch these in .catch\(\) . A useful pattern is to handle errors at the top level of a transaction or at the component/page level, rather than catching each write’s promise individually. 

4

**Canceling/closing**

• 

**DB:** You can call db.close\(\) to close the database \(releasing resources\). Once closed, calling db.open\(\) again will reopen it. db.delete\(\) returns a promise that deletes the database entirely. 

**Transaction Example:** Bulk-add inside a transaction and query within it: await db.transaction\('rw', db.friends, db.pets, async \(\) => \{

await db.friends.add\(\{name: 'Mary', age: 28\}\); 

await db.friends.add\(\{name: 'John', age: 34\}\); 

await db.pets.add\(\{name: 'Rex', ownerName: 'John'\}\); 

// Since we're in a transaction, this query sees the above writes:

const friends = await db.friends.where\('age'\).below\(30\).toArray\(\); 

console.log\('Under 30:', friends\); 

\}\); 

// On success: transaction committed; on any error: transaction rolled back. 

This shows you can even await inside the transaction callback. Note that you only need one .catch for the entire transaction, not one per operation. Dexie’s promise will reject with the first error encountered. 

**Schema Versioning and Migrations**

Dexie ties its schema to numeric versions. Each time you change the schema \(add/remove indexes or object stores\), bump the version number:

// Initial version 1:

db.version\(1\).stores\(\{

items: '\+\+id,name,category' 

\}\); 

// Later, version 2 adds a new field:

db.version\(2\).stores\(\{

items: '\+\+id,name,category,price' 

\}\).upgrade\(tx => \{

// Optional: migrate existing data if needed. 

tx.table\('items'\).toCollection\(\).modify\(item => \{

item.price = 0; // default price

\}\); 

\}\); 

The upgrade\(tx\) callback \(optional\) lets you transform data from the old schema to the new one. Dexie will automatically open the database with version 2 and run the upgrade if it was previously at version 1. 

\(Internally, Dexie maps its numeric version to the IndexedDB version; e.g. Dexie version 2 maps to IDB

version 2.\) For example, adding a new indexed field is as simple as adding it to the stores schema string. 

5

Dexie will create the index without manual createIndex\(\) calls 1 . You can use these versioned schemas to **migrate an existing non-Dexie database** by declaring the old indexes in version 1 and then new indexes in higher versions. 

**Migration Example:** Suppose you initially had:

db.version\(1\).stores\(\{ friends: "\+\+id,name,age" \}\); 

Later you want to add a shoeColor field:

db.version\(2\).stores\(\{

friends: "\+\+id,name,age,shoeColor" 

\}\); 

After deploying this code, opening the DB will upgrade to version 2 and create the new shoeColor index. 

\(If you need to populate shoeColor for existing records, add an .upgrade\(\) handler.\) Dexie’s docs provide a tutorial on migrating a legacy IndexedDB to Dexie that illustrates these steps. 

**Performance Tips & Best Practices**

**Use**

• 

**Indexed Queries:** Always leverage indexes to filter data. For example, prefer db.friends.where\('age'\).equals\(30\).toArray\(\) over loading all friends and filtering in memory. Dexie’s design avoids full scans unless necessary. 

**Bulk**

• 

**Operations:** If inserting or updating many records, use Dexie’s bulk methods inside a transaction: db.friends.bulkAdd\(\[...\]\) , bulkPut\(\[...\]\) , bulkDelete\(...\) . These reduce overhead compared to looping adds. Bulk writes run more efficiently on the IndexedDB

backend. 

**Limit**

• 

**& Offset:** For large result sets, use .limit\(n\) and .offset\(n\) to page through data, rather than calling .toArray\(\) on a huge collection. 

**Avoid**

• 

**unnecessary data:** In schema .stores , only index fields you need. Unindexed fields don’t improve query speed and cost nothing to include, but don’t declare every property as an index string. The Dexie cheat-sheet emphasizes “Don’t declare all columns like in SQL” – only list properties you plan to query on 18 . 

**Pr**

• **omise Handling:** Dexie uses Promises \(the global Promise by default\) for async. Do not mix different Promise libraries inside a Dexie transaction; always use the global Promise \(or Dexie.Promise\) to keep the transaction alive 19 . Don’t over-catch errors: in general let errors propagate to your top-level handler so transactions or calling code can abort properly. 

6

**Database**

• 

**Instance:** Create one shared Dexie instance \(e.g. in a module\) and use it throughout your app. Don’t repeatedly open/close in different parts of code, as that incurs overhead. The instance caches database metadata and stays open. 

**Performance**

• 

**Tools:** Dexie’s core is optimized, but you can profile in dev tools. For very large data, consider using table.orderBy\(index\).each\(\) rather than .toArray\(\) to stream results. 

Also, consider using Dexie.Observable \(an addon\) or the built-in liveQuery for reactive UIs rather than constantly polling. 

**Cr**

• **oss-Window Sync \(Optional\):** Dexie automatically enables cross-tab notification as of v3.1: if another tab or worker \(in the same origin\) makes changes via Dexie, your app’s live queries will update 20 . This is built into Dexie: you do not need extra code to observe other tabs. 

**Performance Example:** Using bulk and limiting:

// Bulk-add many records in one transaction

await db.transaction\('rw', db.logs, async \(\) => \{

await db.logs.bulkAdd\(logEntries\); // faster than .add in a loop

\}\); 

// Query a large table page-by-page

let page = 0, pageSize = 100; 

while \(true\) \{

const chunk = await

db.friends.orderBy\('id'\).offset\(page\*pageSize\).limit\(pageSize\).toArray\(\); if \(chunk.length === 0\) break; 

console.log\('Page', page, chunk\); 

page\+\+; 

\}

**Integrating Dexie with React: dexie-react-hooks**

To use Dexie in React, simply install and import Dexie and your database instance as usual. Create and open the Dexie DB in a module, and import that db into your components. For example:

// db.js

import Dexie from 'dexie'; 

export const db = new Dexie\('AppDB'\); 

db.version\(1\).stores\(\{ friends: '\+\+id,name,age' \}\); 

db.open\(\); 

In your React components, you can use dexie-react-hooks to automatically re-render when data changes. Install via:

7

npm install react dexie dexie-react-hooks

**useLiveQuery**

useLiveQuery\(querier, deps?, defaultResult?\) runs the given query function and subscribes to its results. Whenever underlying Dexie data changes in a way that affects the query, the component will re-render with new data. Example:

import React from 'react'; 

import \{ useLiveQuery \} from 'dexie-react-hooks'; 

import \{ db \} from './db'; 

export function OlderFriends\(\) \{

// This query returns a Promise of an array of friend objects. 

const friends = useLiveQuery\(

\(\) => db.friends.where\('age'\).above\(75\).toArray\(\), 

\[\] // dependencies: rerun query if deps change

\); 

if \(\!friends\) return null; // still loading or no data

return \(

<ul> 

\{friends.map\(friend => 

<li key=\{friend.id\}>\{friend.name\}, \{friend.age\}</li> 

\)\}

</ul> 

\); 

\}

In this example, useLiveQuery observes the friends table. If any record in friends is added/

updated/deleted and would affect the query \(age>75\), the component updates automatically 21 22 . 

Internally, useLiveQuery wraps Dexie’s liveQuery\(\)  and React’s state. By default it returns undefined \(falsy\) on initial render until the query resolves, so you often check if \(\!result\) return null 23 . 

**Dependencies and State**

The second parameter to useLiveQuery is like React’s useEffect deps: include any props or state variables that the query depends on. For example:

function FriendList\(\{ maxAge \}\) \{

const friends = useLiveQuery\(

\(\) => db.friends.where\('age'\).belowOrEqual\(maxAge\).toArray\(\), 

\[maxAge\]

// re-run when maxAge changes

\); 

8

if \(\!friends\) return null; 

return <div>Count: \{friends.length\}</div>; 

\}

This way, changes in component props or state can trigger the query again. 

**useObservable**

useObservable\(obs\) can subscribe to any observable object. For example, with RxJS or Dexie’s own liveQuery\(\) observable. A common use is to use liveQuery manually or any custom observable state. Example \(simple RxJS BehaviorSubject\):

import React from 'react'; 

import \{ BehaviorSubject \} from 'rxjs'; 

import \{ useObservable \} from 'dexie-react-hooks'; 

const counter$ = new BehaviorSubject\(1\); 

export function CounterDisplay\(\) \{

const count = useObservable\(counter$\); 

return <p>Count is \{count\}</p>; 

\}

Changing counter$.next\(newValue\) anywhere will cause CounterDisplay to re-render with the new value 24 . In practice, useLiveQuery is often sufficient, but useObservable is provided for other reactive patterns. 

**Data Synchronization Patterns**

Because useLiveQuery observes DB changes, you can use Dexie as a local state manager. Multiple components can read/write the DB, and all observing components will update when data changes. For example, one component could add a friend via db.friends.add\(...\) , and any useLiveQuery elsewhere watching that table will auto-update. Dexie even supports **cross-tab changes**: if another browser tab or service worker modifies the DB via Dexie, useLiveQuery in this tab will rerun the query 20 . This makes it easy to build real-time UIs. \(For syncing across devices or domains, Dexie Cloud or manual sync logic is needed.\)

**Putting it together:** A simple React CRUD component with live queries: function FriendsManager\(\) \{

const \[newName, setNewName\] = useState\(""\); 

const friends = useLiveQuery\(

\(\) => db.friends.orderBy\('name'\).toArray\(\), 

\[\]

\); 

9

const addFriend = async \(\) => \{

await db.friends.add\(\{name: newName, age: 0\}\); 

setNewName\(""\); 

\}; 

if \(\!friends\) return <p>Loading...</p>; 

return \(

<div> 

<ul>\{friends.map\(f => <li key=\{f.id\}>\{f.name\}</li>\)\}</ul> 

<input value=\{newName\} onChange=\{e => setNewName\(e.target.value\)\}/> 

<button onClick=\{addFriend\}>Add Friend</button> 

</div> 

\); 

\}

Here, when you click “Add Friend”, the db.friends.add triggers Dexie’s change tracking, so the useLiveQuery hook sees the new data and re-renders the list automatically. 

**Other Hooks**

The dexie-react-hooks library currently provides **useLiveQuery **, **useObservable **, and **usePermissions ** \(for Dexie Cloud, a synchronization addon\) 25 . usePermissions is specific to Dexie Cloud’s permission model and not needed for basic Dexie use. For React, the two main hooks \( useLiveQuery , useObservable \) cover most use cases of integrating IndexedDB data into your components. 

**Other Dexie Features and Gotchas**

**De**

• **xie.Observable:** Dexie has an Observable addon that allows you to subscribe to live DB changes even outside React \(e.g. to sync data between windows\). It’s built-in to useLiveQuery ’s mechanics. 

If using multi-window apps, make sure to enable db.open\(\{addons: \{Observable: true\}\}\) or include the addon. 

**Case**

• 

**sensitivity:** By default, IndexedDB \(hence Dexie\) is case-sensitive in string comparisons. Dexie provides .equalsIgnoreCase\(\) and .startsWithIgnoreCase\(\) . Use them if you need case-insensitive behavior. 

**Safari**

• 

**Quirks:** Safari \(especially older versions\) has some IndexedDB quirks. Dexie largely smooths these out, but note that multi-entry indexes are **not supported in Safari 8/9 or IE **26 . Also, Safari’s implementation sometimes requires a user-gesture before DB writes \(the famous iOS Safari bug\). 

Testing on target browsers is recommended. 

**Memory**

• 

**and Cleanup:** Dexie caches data in memory only as needed. Large reads can still consume memory. Use .bulkGet\(\) or queries that return keys \(like .keys\(\) \) if you only need specific fields. Also, call db.delete\(\) in tests or install flows if you need to reset the DB. 

10

**V**

• **ersion Number Precision:** Dexie’s version numbers are numeric \(non-integer allowed\). Internally, Dexie uses the given number times 10 for IDB version. For example, Dexie v1.0 is IDB v10; Dexie v1.5

is IDB v15. Usually you just use integers \(1, 2, 3…\) for simplicity. 

**T**

• **ypeScript Support:** Dexie has full TypeScript definitions. If using with TS, you can define an interface for your schema and give Dexie a generic type, enabling strong typing on db.table . For example: 

interface Friend \{ id?: number; name: string; age: number; \}

class MyDB extends Dexie \{

friends\!: Dexie.Table<Friend, number>; 

constructor\(\) \{

super\('MyDB'\); 

this.version\(1\).stores\(\{friends: '\+\+id,name,age'\}\); 

\}

\}

const db = new MyDB\(\); 

**Inde**

• 

**xable Types:** Dexie supports all IDB indexable types: primitives \(number/string/Date\) and binary types for keys. You cannot index arbitrary objects unless you convert them to string/JSON. 

**Extensibility:**

• 

Dexie’s middleware and hooks allow adding custom behavior \(e.g. logging, access control\). For React apps, a useful pattern is to place your Dexie database instance in a React context to provide it app-wide, but this is optional since Dexie is just a JS module. 

**Summary:** Dexie.js provides a powerful yet simple layer over IndexedDB, supporting advanced queries \(multi-entry, compound indexes, OR/ANY queries\), robust transactions, and reactive live queries. The dexie-react-hooks library makes it easy to wire IndexedDB state into React components with useLiveQuery and similar hooks. Together, they allow you to use IndexedDB in a modern, declarative way. Use the official Dexie docs and API reference for details on each method \(all features mentioned above are documented in Dexie’s docs 3

2

21 \). 

**Sources:** Official Dexie documentation and API reference \(Dexie.js website\), and dexie-react-hooks documentation 2

3

13

21

24 . 

1

4 Dexie.js.md

https://github.com/dexie/dexie-website/blob/d7054ef267b149023b805a5125aa00114db38931/docs/Dexie.js.md

2

18 API-Reference.html

https://github.com/mzaini30/dokumentasi-dexie/blob/a98f04247f8d14f195cb8748c085efee3891555c/docs/API-Reference.html

3

6

7

8

26 MultiEntry-Index.md

https://github.com/dexie/dexie-website/blob/d7054ef267b149023b805a5125aa00114db38931/docs/MultiEntry-Index.md

11

5

16

17

19 Best-Practices.html

https://github.com/mzaini30/dokumentasi-dexie/blob/a98f04247f8d14f195cb8748c085efee3891555c/docs/Tutorial/Best-

Practices.html

9

10 Compound-Index.html

https://github.com/mzaini30/dokumentasi-dexie/blob/a98f04247f8d14f195cb8748c085efee3891555c/docs/Compound-

Index.html

11 WhereClause.anyOf\(\).html

https://github.com/mzaini30/dokumentasi-dexie/blob/a98f04247f8d14f195cb8748c085efee3891555c/docs/WhereClause/

WhereClause.anyOf\(\).html

12

13

14 Collection.or\(\).html

https://github.com/mzaini30/dokumentasi-dexie/blob/a98f04247f8d14f195cb8748c085efee3891555c/docs/Collection/

Collection.or\(\).html

15 Collection.filter\(\).html

https://github.com/mzaini30/dokumentasi-dexie/blob/a98f04247f8d14f195cb8748c085efee3891555c/docs/Collection/

Collection.filter\(\).html

20

21

22

23 useLiveQuery\(\).md

https://github.com/dexie/dexie-website/blob/d7054ef267b149023b805a5125aa00114db38931/docs/dexie-react-hooks/

useLiveQuery\(\).md

24 useObservable\(\).md

https://github.com/dexie/dexie-website/blob/d7054ef267b149023b805a5125aa00114db38931/docs/dexie-react-hooks/

useObservable\(\).md

25 dexie-react-hooks.md

https://github.com/dexie/dexie-website/blob/d7054ef267b149023b805a5125aa00114db38931/docs/libs/dexie-react-hooks.md

12


# Document Outline

+ Dexie.js \(IndexedDB\) and dexie-react-hooks Reference  
	+ Advanced Queries and Indexing 
	+ Transactions and Error Handling 
	+ Schema Versioning and Migrations 
	+ Performance Tips & Best Practices 
	+ Integrating Dexie with React: dexie-react-hooks  
		+ useLiveQuery  
			+ Dependencies and State 

		+ useObservable 
		+ Data Synchronization Patterns 
		+ Other Hooks 

	+ Other Dexie Features and Gotchas



