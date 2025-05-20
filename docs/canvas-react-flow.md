# Building a Custom Workflow Canvas with React

# Flow v12 in Next.js 15

## Introduction

In this guide, we will create an **automation workflow canvas** in a Next.js 15 app using **React Flow v12**. The
canvas will allow automation consultants to visually build automations (with OpenAI agent support) by
connecting custom “pixel-style” nodes. We’ll cover how to implement custom node components (with pixel-
art styling, tooltips, icons, and designated drag handles) and enable features like zoom-to-fit, undo/redo,
and JSON export/import. We also emphasize performance for moderate-scale graphs (under 100 nodes)
and show how to use **Dexie.js** for local storage of flows. All examples will integrate with **Tailwind CSS** and
**shadcn/ui** (a Tailwind + Radix UI component library) for consistent styling.

**Tech Stack:** Our implementation uses React 19 (similar API to React 18) and Next.js 15. React Flow v
works seamlessly with modern React and supports Next.js (including the App Router). We will primarily use
React Flow on the client side (with use client components or dynamic import in Next.js to avoid SSR).
Let’s start by setting up React Flow in our project, then delve into building the custom workflow canvas.

## Setting Up React Flow in a Next.js 15 App

First, install React Flow v12 and its peer dependencies:

```
npminstall @xyflow/react # React Flow v12 (new scope @xyflow)
npminstall dexie # Dexie.js for storage
# (Tailwind and shadcn/ui should already be configured in your Next.js app)
```
**Importing Styles:** React Flow requires some base CSS for elements (handles, edges) to display properly.
Import the default styles in your _app.jsx or component file:

```
import '@xyflow/react/dist/style.css'; // Base styles for React Flow components
```
This ensures things like edges and controls are visible. In a Next.js 15 App Router setup, you can include this
in a layout or the page component (with \"use client\" at top). Next, wrap your canvas in
ReactFlowProvider (if using React Flow across nested components) or use the <ReactFlow>
component directly in a page component. For example, in a Next.js page component:

```
\"use client\";
import React from 'react';
```

```
import { ReactFlow, ReactFlowProvider, Background, Controls } from '@xyflow/
react';
import '@xyflow/react/dist/style.css';
```
```
export default function WorkflowCanvasPage() {
const initialNodes = [...]; // define initial nodes if any
const initialEdges = [...];
```
```
return (
<ReactFlowProvider>
<div className="w-fullh-full"> {/* container div with fixed dimensions
*/}
<ReactFlow
nodes={initialNodes}
edges={initialEdges}
fitView
style={{ background: '#f0f0f0'}} // optional: canvas background
>
<Background /> {/* grid background */}
<Controls/> {/* zoom/fit controls panel */}
</ReactFlow>
</div>
</ReactFlowProvider>
);
}
```
Here we use a full-page container and include React Flow’s **Background** (to show a grid) and **Controls**
panel. The <Controls /> component provides convenient buttons for zoom-in, zoom-out, fit-to-view,
and lock controls out of the box. We also set the fitView prop so that the initial view will auto-zoom
to fit all nodes on mount (you can adjust this or call fitView() manually as shown later).

**Note:** If using Next.js 15 with Server Components, ensure the canvas is not SSR’d (either by placing it in a
client component or using dynamic(() => import('...'), { ssr: false })). React Flow 12 _does_
support SSR/SSG rendering of static images , but for interactive canvas we render on the client.

## Creating Custom “Pixel-Style” Nodes

React Flow allows us to use **custom React components as nodes** , giving full flexibility to render any
content inside nodes. We will create a custom node that fits a pixel-art aesthetic – for example, a small
rectangular node with an icon and label, styled with Tailwind classes to look pixelated or retro. Each node
will have an **icon** , a **label** , and a **tooltip** for additional info. We’ll also designate a specific element as the
**drag handle** so that users can drag the node by that element only.

**1. Define the Node Component:** A custom node is simply a React component. React Flow will wrap it in an
interactive container and pass props like id , data, and position automatically. Inside the
component, use React Flow’s <Handle> components to define connection points for edges (source and

```
1
```
```
2
```
```
3
```
```
4
```

target handles). Also, add any interactive UI needed (icons, tooltips, etc). For our pixel-style node, we
might use a small icon (e.g. an 8x8 pixel icon) and a label. Here’s an example in JSX:

```
import { Handle, Position} from'@xyflow/react';
import { Tooltip, TooltipTrigger, TooltipContent} from'@/components/ui/
tooltip'; // shadcn/ui Tooltip
```
```
constPixelNode= ({ id, data, selected }) => {
return(
<divclassName="bg-gray-800 text-white text-xs font-mono rounded px-2 py-
shadow">
{/* Drag handle area: icon + label */}
<divclassName="flex items-center gap-1 drag-handle__custom cursor-move">
<imgsrc={data.icon} alt=""className="w-4 h-4"/>
<span>{data.label}</span>
</div>
{/* Tooltip trigger (e.g., info icon) */}
{data.description&& (
<Tooltip>
<TooltipTriggerasChild>
<buttonclassName="nodrag text-yellow-300 text-xs underline">info</
button>
</TooltipTrigger>
<TooltipContent>{data.description}</TooltipContent>
</Tooltip>
)}
{/* Connection handles */}
<Handletype="source" position={Position.Right} />
<Handletype="target" position={Position.Left} />
</div>
);
};
```
In this component:

- We use a <div> as the node container, styled with Tailwind (dark background, tiny monospace font, etc.)
to achieve a pixelated UI. (You might even use CSS like image-rendering: pixelated on icons for a
retro look).
- The top <div> with class drag-handle__custom contains the node’s icon and label. By giving it this
class and specifying it in dragHandle, we restrict dragging to this area (more on that below). We also add
    cursor-move to hint it’s draggable.
- We include a Tooltip from shadcn/ui: the trigger is a small “info” button with class nodrag. The nodrag
class is important on interactive elements – it tells React Flow to prevent dragging or selecting when clicking
that element. This way, clicking the info button won’t move the node , it only shows the tooltip.
(React Flow provides utility classes like nodrag to fine-tune interactions inside nodes).
- Two <Handle> components are added for connections: one source on the right, and one target on
the left. These create ports on the node for connecting edges. We could add multiple handles if needed

```
5 6
```
```
7 8
```

(each can get an id prop if we want to distinguish connections). In our simple case, one input and
one output handle suffice.

**2. Register the Custom Node:** To use PixelNode in the graph, add it to the nodeTypes map when
rendering ReactFlow. For example:

```
constnodeTypes= { pixelNode: PixelNode };
```
```
<ReactFlow
nodes={nodes} edges={edges}
nodeTypes={nodeTypes}
...>
...
</ReactFlow>
```
Now any node object with type: 'pixelNode' will render using our PixelNode component.

**3. Applying Styles:** Since custom nodes have _no default styling_ in React Flow, you have full control. Use your
design system (Tailwind utilities, shadcn components) to style the node appearance. For instance, Tailwind
can style backgrounds, borders, etc., and you can incorporate shadcn/ui components inside nodes for
consistent look. The React Flow docs note that you are free to use any styling method (including Tailwind
CSS) for custom nodes. Ensure that any interactive child elements that should not trigger node drag/
selection have the nodrag class (and if you have any scrollable region inside a node, use the nowheel
class to prevent canvas panning on scroll ).

**Pixel Aesthetic Tips:** To reinforce a pixel-art style, you might use pixelated icons (PNG or SVG) and perhaps
a retro font or low-res font-smoothing. Tailwind can be used to apply image-rendering: pixelated via
custom CSS if needed. The small size of nodes (e.g. the example uses a 4px icon and tiny font) also gives a
“pixel” feel. These design choices can be adjusted as needed.

## Enabling Drag Handles for Node Movement

By default, an entire node is draggable in React Flow. However, our nodes might contain buttons and inputs;
we may want to restrict dragging to a specific portion (like a header or an icon) to avoid accidental moves.
React Flow supports this via a **drag handle selector** on each node.

When creating a node (in the nodes array), you can specify a CSS selector for the draggable area. For
example, if our custom node uses .drag-handle__custom as above, we set:

```
constnewNode= {
id:'node-1',
type: 'pixelNode',
position: { x: 0, y: 0 },
data: { ...},
```
```
9 10
```
```
11
```
```
12
```

```
dragHandle:'.drag-handle__custom'
};
```
Including dragHandle: '.drag-handle__custom' in the node’s definition tells React Flow that only
elements matching that class inside the node should initiate drag. In our PixelNode, the
icon+label container has that class, so users must drag from the node’s top bar. This prevents, for example,
clicking the tooltip button or other content from moving the node. The **Drag Handle** example in React
Flow’s docs demonstrates this usage: a dragHandle selector is provided in the node props and only that
part is draggable.

Make sure the designated drag-handle element spans a reasonable area (like a title bar or icon) so it’s
intuitive. If you omit dragHandle, the whole node is draggable by default.

## Zoom and Viewport Controls

For a good user experience, our canvas should support panning and zooming, including a “zoom to fit”
feature to focus the entire workflow. React Flow provides both built-in UI controls and programmatic control
over the viewport.

**Controls Component:** The easiest way to add zoom controls is using <Controls /> (as we did in setup).
The Controls component renders a panel with buttons for **zoom in, zoom out, fit view,** and **lock** (to toggle
pannability). By default all buttons are shown (configurable via props) and the fit-view button will zoom
the viewport to encompass all nodes. Including <Controls /> is often enough for basic
navigation.

**Programmatic Zoom/Pan:** For custom behavior (like centering on a specific node or zooming via keyboard
shortcuts), React Flow exposes viewport methods through the **ReactFlow instance**. We can obtain the
instance by using the useReactFlow() hook (inside a child component of ReactFlow) or via the onInit
callback. The instance provides methods such as zoomIn(), zoomOut(), setCenter(x,y,zoom),
setViewport({ x, y, zoom }), and fitView(). For example, to implement a custom “Fit to
Screen” button or keyboard shortcut, call instance.fitView({ padding: 0.2 }) to nicely fit all nodes
in view. Similarly, instance.setCenter(nodeX, nodeY, { zoom: 1.5 }) can focus on a particular
node coordinate at a given zoom level. These methods animate the transition by default (you can pass a
duration option for smooth zooming ).

**Recommended Viewport Settings:** React Flow’s default panning/zooming mimics map-like behavior (drag
canvas to pan, scroll to zoom). You might consider enabling **pan on scroll** (so that scrolling the mouse
or trackpad pans the canvas when a modifier key isn’t pressed). By default, panOnScroll is false and
zoomOnScroll is true, meaning regular scroll will zoom. Some UIs (like diagrams) prefer the opposite.
You can set panOnScroll={true} and perhaps require a key for zoom (e.g.
zoomActivationKeyCode="Meta" to only zoom when holding Ctrl/Cmd ). This is optional, but can
improve navigation especially on trackpads. Also, the prop preventScrolling is true by default – this
stops the browser from scrolling the page when you’re interacting with the canvas (usually desirable for
fullscreen canvas).

```
13 14
```
```
15
```
```
1
16 17
```
```
18
19 20
```
```
21
```
```
22
```
```
23
```
```
24
```

In summary, use the Controls for quick implementation, and the useReactFlow() instance for advanced
control of the viewport (e.g., resetting the view, focusing nodes, custom UI triggers).

## Keyboard Navigation and Shortcuts

Interactive keyboard support is crucial for accessibility and power users. **React Flow has built-in keyboard
controls** for selecting and moving elements, which we should leverage. By default:

```
Nodes and edges can receive focus (they have tabIndex={0} and role="button") and be navigated
via Tab.
A focused node/edge can be selected by pressing Enter or Space , and unselected with **Escape】
.
When a node is selected, you can use Arrow keys to move it (hold Shift + Arrow for larger steps)
```
. This allows precise keyboard positioning.
Pressing **Delete** will remove the selected node or edge (this is part of the default accessibility
behavior for deletable elements).

These features are enabled by default as long as nodesFocusable and nodesDraggable are true
(which they are, unless you disable them). In React Flow v12, if you set
disableKeyboardA11y={true} on ReactFlow, it will turn off these keyboard interactions – so **do not
disable** it unless you have a custom scheme. Keeping the default means our canvas supports keyboard
navigation out-of-the-box.

**Custom Shortcuts (Undo/Redo, etc.):** Beyond the built-ins, you may want additional shortcuts. For
instance, **Undo (Ctrl+Z)** and **Redo (Ctrl+Shift+Z)** are common. If using React Flow Pro’s undo feature
(discussed below), those are handled for you. Otherwise, you can capture key events to implement them.
One approach is React Flow’s useKeyPress hook, which lets you detect specific key presses. For example:

```
constisUndoPressed = useKeyPress(['Meta+z', 'Control+z']);
useEffect(() => {
if(isUndoPressed) handleUndo();
}, [isUndoPressed]);
```
This hook returns true while the key combo is active. Alternatively, add a keydown listener on the
document to catch 'keydown' events for ctrlKey && key === 'z'. Use whichever fits your needs.

You can also create shortcuts for “add node” (maybe pressing **N** to add a new node), or “zoom to fit” (maybe
**0** or **F** ). Because React Flow’s canvas might not always have focus, global shortcuts (attached to window)
might be needed. Just be careful to avoid conflicts with browser defaults.

By utilizing these keyboard controls, users can navigate and edit the flow with ease. The combination of
built-in arrow-key movement and custom shortcuts for high-level actions will create a smooth editing
experience.

### •

```
25
```
-
    25
-^26
    27
-

```
28
28
```
```
29 30
```

## Connection Validation and Constraints

In automation workflows, not every node should connect to every other. We often need to enforce rules
(e.g. a “Start” node can only have one outbound connection, or certain node types can’t link). React Flow
provides an easy way to **validate connections** before they are created.

Use the isValidConnection prop on <ReactFlow> to supply a function that checks each attempted
connection. This function receives a Connection object with details (source, target,
sourceHandle, targetHandle). If it returns false, the link is disallowed (the edge won’t be added). For
example:

```
constisValidConnection= (connection) => {
const{ source, target } = connection;
// Only allow connection if target node is not a "Start" node:
if(target&& target.startsWith('start-'))return false;
returntrue;
};
```
```
// ...
```
```
<ReactFlow... isValidConnection={isValidConnection} onConnect={onConnect} />
```
In the React Flow docs, a simple example only allows connections if the target node’s ID is "B". They
pass that validator into <ReactFlow> along with a normal onConnect handler. You can implement
any logic needed: check node types (available via your node data), enforce max connections, prevent cycles,
etc. For instance, to **prevent cycles** , you could maintain a graph adjacency list and in
isValidConnection test whether connecting source->target would create a loop (React Flow also has a
useOnConnect event sequence and a dedicated example for cycle detection ).

Additionally, each **Handle** can limit connections using props like maxConnections or by being marked as
not connectable in certain cases, but a global isValidConnection is often simplest. You might also use
the connectionLineStyle or onConnectStart/onConnectEnd events to give user feedback for
invalid drops.

By validating connections, we ensure the workflow diagram remains logically correct (no improper links),
improving both UX and the correctness of automation logic.

## State Management with React Flow Hooks

Managing the state of nodes and edges is crucial, especially as we implement undo/redo and persistence.
React Flow v12 offers hooks to easily manage state in a **controlled** way. We’ll use the provided hooks and
also discuss using the internal store for advanced cases.

**useNodesState & useEdgesState:** These hooks simplify state handling by wrapping useState and
providing onChange handlers. For example:

```
31
32
```
```
33
```

```
const[nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const[edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
```
This pattern (used in React Flow’s examples) lets React Flow manage changes like drag or connect events,
while keeping the source of truth in our component state. We pass nodes, edges and the
onNodesChange, onEdgesChange handlers to <ReactFlow> so it calls those when the user modifies
the graph (e.g. moving a node will trigger onNodesChange which uses setNodes internally). This
controlled mode makes it easy to respond to changes or save the state.

**useReactFlow:** As mentioned, useReactFlow() gives access to the ReactFlowInstance, which not only
controls viewport (as above) but also can manipulate nodes/edges. For instance, reactFlow.getNodes()
returns the latest nodes array and reactFlow.setNodes(newNodes) updates them. You can use
these methods for programmatic updates – but be cautious to avoid conflicts with the state hooks.
Generally, if using controlled state, prefer updating via setNodes/setEdges from the hooks or using
provided utility functions like addEdge (from @xyflow/react). The instance methods are handy for
one-off adjustments (like updating node data or focusing a node). Note that useReactFlow must be
called in a child of ReactFlow (or within ReactFlow via a Panel/Control), and initially the instance might not
be ready on first render (you might need to guard calls until after the ReactFlow is initialized).

**Accessing Store State with useStore:** For more advanced scenarios, React Flow exposes a zustand store
internally. The useStore hook allows reading from it. This can be useful to get global state like the
current selection or custom actions. For example, to get a custom updater function from state:

```
constupdateNodeColor = useStore((state) => state.updateNodeColor);
```
If you had defined updateNodeColor in the store (via extending React Flow’s store in an uncontrolled
flow scenario), this would retrieve it. In most cases, you won’t need to directly use useStore unless
you’re integrating with an external state management or adding custom state to React Flow. But one
convenient trick: you can get the current ReactFlow instance from the store if needed via
useStore.getState().reactFlowInstance (for example, outside of a component, as seen in some
GitHub discussions). For our implementation, the combination of useNodesState/useEdgesState and
useReactFlow covers most needs.

To summarize, we will keep nodes and edges in React state using the provided hooks, which simplifies
implementing features like undo/redo and persistence because we always have the latest state in our
component.

## Undo/Redo Functionality

Undo/redo support greatly enhances user confidence when editing a workflow. React Flow Pro (the paid
edition) includes a built-in solution via a useUndoRedo hook, which manages history snapshots of the
graph. If you have Pro, it’s recommended to use this – it tracks moves, additions, and deletions of
nodes/edges automatically and lets users undo (Ctrl+Z) or redo (Ctrl+Shift+Z) with minimal effort. The

```
34
```
```
35 36
```
```
37 38
```
```
39
```
```
40
41
```

Pro example uses a snapshot-based approach and enables keyboard shortcuts by default , meaning with
useUndoRedo integrated, your canvas will respond to Ctrl+Z / Ctrl+Y (or Shift+Z) out of the box.

If you’re using the open-source version (no Pro), you can implement undo/redo manually. One approach is
to maintain a history stack of node/edge states: - Whenever a change occurs (you can hook into
onNodesChange/onEdgesChange or the onConnect, onEdgesDelete, etc. events), push the new
{ nodes, edges } snapshot onto an undoStack.

- Also maintain a redoStack. On an Undo action, pop from undoStack (and push the current state onto
    redoStack before reverting). On Redo, do the opposite.
- Apply the popped state by calling setNodes/setEdges (or reactFlowInstance.setNodes) to
update the canvas. You might also need to refresh the reactFlowInstance.fitView() if the layout
changes drastically (optional).

This manual method requires careful management to avoid memory bloat (you might cap the history size
for performance). Since our scale is under 100 nodes, snapshots are not huge, but be mindful if node data
includes large objects. Also, disable combining of multiple actions if needed (or implement a debounce so
that dragging a node doesn’t create dozens of snapshots – maybe only capture drop events, not every tiny
move).

In our Next.js app, we could use React context or a zustand store to hold the undo/redo stacks so that any
part of the UI (e.g., menu buttons or keyboard handlers) can trigger the actions. For example, a simple
implementation:

```
// Pseudocode
const[undoStack, setUndoStack] = useState([]);
const[redoStack, setRedoStack] = useState([]);
```
```
constonNodesChange = useCallback((changes) => {
setUndoStack(stack => [...stack, nodes]); // push current state before
change
setRedoStack([]); // clear redo on new action
setNodes(applyNodeChanges(changes, nodes)); // apply changes normally
}, [nodes]);
```
And then define handleUndo to pop from undoStack and setNodes to that, etc. Managing edges
similarly or combining node/edge state together is up to you.

**Tip:** Instead of storing raw nodes/edges arrays, you can use reactFlowInstance.toObject() to
capture the whole flow (including viewport) as a snapshot. This gives a single serializable object
representing state. Pushing that on a stack and restoring via setNodes/setEdges/setViewport (as we
do for persistence) can simplify undo/redo implementation at the cost of a bit more data per snapshot.

Overall, if Pro is an option for your project, useUndoRedo is the straightforward path to get robust undo/
redo. If not, a custom implementation as above will work for an MVP – just ensure thorough testing of edge
cases (undoing a deletion of a node that had connections, etc., ensuring those edges also are restored).

```
40
```
```
42
```

## Saving and Loading Flows (Export/Import to JSON)

Supporting **export and import** of the workflow allows users to save their automation designs or share
them. We’ll implement this by serializing the canvas to JSON and storing it locally using **Dexie.js** (which
provides IndexedDB storage). Dexie is a lightweight IndexedDB wrapper that works well for saving
structured data offline (and is async and fast ).

**Serializing the Canvas:** React Flow’s instance has a convenient toObject() method that returns a JSON-
serializable object containing nodes, edges, and viewport state. We can use this to get the current flow
state at any time. For example:

```
const{ toObject } = useReactFlow();
consthandleExport= () => {
constflowData = toObject();
constjson= JSON.stringify(flowData, null, 2);
downloadFile(json, 'workflow.json'); // you can implement a util to download
the string as a file
};
```
This would allow a user to download the JSON (e.g., for backup). Alternatively, one could copy it to clipboard.
The key is that flowData will include everything to recreate the flow.

**Using Dexie for Persistence:** Instead of (or in addition to) manual export, we can save flows in the
browser’s IndexedDB so that the canvas state is persistent between sessions. Let’s set up Dexie. You
typically define a database and the stores (tables) you need:

```
import Dexiefrom'dexie';
constdb =new Dexie('WorkflowDB');
db.version(1).stores({
flows:'id,name' // 'flows' table with primary key 'id' and an index on
'name'
});
```
Dexie uses a declarative schema: here we create a table **flows** with an id (could be a UUID or user-specific
name) and name index for querying. We can store each flow’s data under a unique id.

To save the current flow to Dexie:

```
asyncfunction saveFlow(flowId) {
if(!reactFlowInstance) return;
constdata= reactFlowInstance.toObject();
data.name = flowId; // or store name separately
```
```
43
```
```
42
```
```
44
```

```
awaitdb.flows.put({ id: flowId, data });
}
```
And to load a saved flow:

```
asyncfunction loadFlow(flowId) {
constrecord = awaitdb.flows.get(flowId);
if(record&& record.data) {
const { nodes, edges, viewport } = record.data;
setNodes(nodes|| []);
setEdges(edges|| []);
if (viewport) {
const { x, y, zoom} = viewport;
setViewport({ x, y, zoom});
}
}
}
```
In this snippet, setViewport comes from useReactFlow() (we destructured it like const
{ setViewport } = useReactFlow()). It applies the saved pan/zoom so the canvas looks exactly as it
was when saved. We update nodes and edges via the state hooks. After calling loadFlow, the
ReactFlow component will render the restored diagram.

You can call saveFlow periodically (or on each change) for auto-save, but be cautious about performance
if doing it on every node movement. Dexie is pretty fast for moderate data and non-blocking (returns
promises), but you might throttle saves. For manual control, a “Save” button can trigger saveFlow(), and
a “Load” or chooser can call loadFlow().

**Import from JSON:** If a user uploads a JSON (exported earlier), you can simply parse it and do similar to
loadFlow – i.e., use the content’s nodes, edges, viewport to set state. Always validate the data
structure (ensure it matches React Flow’s expected format) when importing untrusted JSON.

By incorporating Dexie, we ensure that even if the page is refreshed or closed, the last saved flows persist
locally. This local-first approach is great for an MVP, removing the dependency on a backend for storage. It
also means working offline is possible. Later on, you might sync these stored flows to a cloud DB or allow
exporting them as files for portability.

## Integration with Tailwind CSS and shadcn/ui

Finally, a note on styling integration: since our app uses Tailwind and shadcn’s component library, we should
keep the workflow canvas UI consistent with the rest of the app. Here are some best practices:

```
Tailwind Utility Classes: You can apply Tailwind classes directly to React Flow elements. For
example, style the canvas container via the style prop or a wrapping <div>. We set a light gray
background on the canvas above using inline style; alternatively, className="bg-gray-100" on
```
```
45
```
### •


```
the ReactFlow component’s wrapper works too. You can also theme edges and handles via CSS
variables or custom styles if needed (React Flow’s default theme can be overridden – see theming
docs – but often simply applying classes to custom nodes is enough). In our custom node, we used
Tailwind for colors, spacing, font, etc., to match the design system. This ensures the nodes feel like
part of the same UI as the rest of the Next.js app.
```
```
shadcn/ui Components: We embedded a Tooltip from shadcn/ui in the node. You can similarly use
other Radix-based components if needed – for example, a context menu on right-click of a node
(React Flow even has a context menu example to integrate with Radix Menu). Ensure that these
components are wrapped in a parent that has ReactFlowProvider (we did that at the page level)
so they can coexist with the canvas. If any shadcn component is interactive inside a node (like a
button, input, etc.), remember to add the nodrag class to it (as we did) to prevent conflict with
canvas dragging.
```
```
Consistent Styling: Use the same Tailwind config (colors, font) for the canvas elements. For
instance, if your app uses shadcn’s dark theme, you might want the ReactFlow background to be
dark as well. React Flow doesn’t automatically inherit app styles for things like the background grid
or Controls, but you can customize them. The <Background> component accepts a color and gap
size, or you can style via CSS. The <Controls> can be customized via replacing the icons/buttons if
you need to match a certain style (by default they are simple SVG icons; you can hide them and
create your own panel if necessary). For an MVP, using them as-is is fine, as they are fairly minimal
and not intrusive.
```
```
Performance Consideration: At <100 nodes, React Flow’s performance is quite good by default.
But to keep things smooth, use React.memo or React.FC optimizations for custom node components
if they become complex. Tailwind classes are static so they don’t cause re-renders, but if you pass
large objects in node data, consider using useMemo to avoid unnecessary updates to nodes.
Also, avoid heavy animations or box-shadows on too many elements, as these can add up. The Dexie
persistence is done asynchronously, so it shouldn’t block the UI.
```
With Tailwind and shadcn integration, your workflow canvas will look like a natural extension of your app’s
UI, while React Flow handles the heavy lifting of diagram interactions.

## Conclusion

By using React Flow v12 in a Next.js 15 app, we have built a feature-rich workflow editor with custom pixel-
style nodes and a suite of functionality: **custom node components** (with icons, tooltips, and restricted drag
handles), **connection rules** , **keyboard navigation** , **zoom controls (fit to view)** , **undo/redo** , and **data
persistence** via Dexie. This canvas can scale to dozens of nodes easily (hundreds if needed) while
maintaining performance , and it integrates with our design system (Tailwind + shadcn) for a consistent
look and feel.

With this setup, automation consultants can visually design their processes, confident that they can easily
navigate the canvas, revert mistakes, and save their work. The combination of React Flow’s powerful API
and our enhancements provides an **implementation-ready workflow builder** ready for an MVP release.
Happy coding!

### •

### •

### •^46

```
46
```

**Sources:** The implementation details and best practices were drawn from the React Flow v
documentation and examples , as well as Dexie’s documentation for client-side storage.
These resources provide further insights into customizing node-based UIs and managing state in React
applications.

The Controls component - React Flow
https://reactflow.dev/api-reference/components/controls

@xyflow/react - React Flow 12 is out · xyflow xyflow · Discussion #3764 · GitHub
https://github.com/xyflow/xyflow/discussions/

Custom Nodes - React Flow
https://reactflow.dev/learn/customization/custom-nodes

Drag Handle - React Flow
https://reactflow.dev/examples/nodes/drag-handle

ReactFlowInstance - React Flow
https://reactflow.dev/api-reference/types/react-flow-instance

Panning and Zooming - React Flow
https://reactflow.dev/learn/concepts/the-viewport

Accessibility - React Flow
https://reactflow.dev/learn/advanced-use/accessibility

useKeyPress() - React Flow
https://reactflow.dev/api-reference/hooks/use-key-press

Validation - React Flow
https://reactflow.dev/examples/interaction/validation

Examples - React Flow
https://reactflow.dev/examples

useReactFlow() - React Flow
https://reactflow.dev/api-reference/hooks/use-react-flow

Using a State Management Library - React Flow
https://reactflow.dev/learn/advanced-use/state-management

Undo and Redo - React Flow
https://reactflow.dev/examples/interaction/undo-redo

Save and Restore - React Flow
https://reactflow.dev/examples/interaction/save-and-restore

Dexie.js for Offline Storage in React Apps - YouTube
https://www.youtube.com/watch?v=WnEc1JbmWVI

Understanding the basics
https://dexie.org/docs/Tutorial/Understanding-the-basics

```
3 11 1 44
```
```
1 16 17
```
```
2
```
```
3 4 5 6 7 8 9 10 11 12
```
```
13 14 15 34
```
```
18 19 20 21 35 36
```
```
22 23 24
```
```
25 26 27 28
```
```
29 30
```
```
31 32
```
```
33 46
```
```
37 38
```
```
39
```
```
40 41
```
```
42 45
```
```
43
```
```
44
```

