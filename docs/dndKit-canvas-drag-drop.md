# Drag-and-Drop with dnd-kit (React 19 + Next.js 15)

# for a Toolbox & Canvas UI

Implementing a drag-and-drop canvas (with an 8px snapping grid and optional collision rules) is feasible
with **dnd-kit** , a modern DnD library for React. Below we’ll outline how to set up dnd-kit’s core primitives
(context, draggable, droppable, sortable), enable keyboard controls, and integrate state management for a
performant, Tailwind-styled UI. We’ll also provide code patterns for dragging items from a toolbox into a
canvas and for sorting a list of dashboard modules.

## dnd-kit Fundamentals and Primitives

**dnd-kit Overview:** dnd-kit is a lightweight, extensible drag-and-drop toolkit for React. It provides low-level
hooks (useDraggable, useDroppable) to turn components into drag sources and drop targets. You
wrap these in a <DndContext> provider so that draggables and droppables can interact within the same
context. (If you need separate isolated drag-drop regions, you can nest multiple DndContexts .)

```
DndContext: The context provider that wraps the part of your app with drag-and-drop. It shares
data via React Context to coordinate draggables and droppables. You must wrap any
components using dnd-kit hooks in a <DndContext> (they need not be direct children, just
somewhere above in the tree). In addition, <DndContext> accepts props for global settings and
event handlers (like onDragStart, onDragEnd, etc.). We’ll use these handlers to update state
when an item is dropped.
```
```
useDraggable: Hook to make an element draggable. You provide a unique id and get back
props like attributes, listeners, setNodeRef, and transform. These are applied to your
element:
```
```
setNodeRef is a ref callback for the element’s DOM node.
listeners is spread on the element to handle pointer/touch events.
attributes includes accessibility attrs (e.g. tabIndex=0 for focus, ARIA roles).
```
```
transform is an object with {x, y} of the current drag translation. Usually you convert this to a
CSS transform for a smooth drag animation (see Performance below).
```
```
useDroppable: Hook to designate a droppable area. You provide an id and (optionally) a data
object. It returns props like setNodeRef (ref for the drop zone) and isOver state. In our case,
the canvas will be a droppable that can accept items from the toolbox, and each list container or
sortable item can also be droppable. If a component is both draggable and droppable (e.g. an item
that can be picked up and also serves as a drop target for sorting), you can reuse the same id for
both hooks.
```
```
1
```
```
2 3
```
### • 2 • • • • • • 4


```
useSortable: A convenience hook from the @dnd-kit/sortable preset, combining draggable
+ droppable for items in a sortable list. With SortableContext (a context provider for a list),
useSortable handles reordering logic. It returns similar refs/props plus a transition style for
smooth reordering. Under the hood, each sortable item is essentially a “draggable droppable” so
items can swap places. We’ll use this for the ROI dashboard modules list.
```
**Sortable Setup:** To make a list sortable, wrap the list in <SortableContext items={arrayOfIds}
strategy={...}> inside <DndContext>. The items prop is the current order of item IDs (must be
kept in state and updated on drop), and the strategy defines how items are positioned during dragging.
For a simple vertical list, use the default or verticalListSortingStrategy for best results. Each list
item component uses useSortable({id}), and you spread its attributes and listeners onto the
item’s root element and set its ref. On drop, dnd-kit will give you which item was dragged and which item is
now “over” it, so you can update the array order (we’ll show this in code).

```
Collision Detection: dnd-kit uses collision detection algorithms to determine what droppable an
item is over during drag (e.g. pointer overlap vs. center distance). For list sorting, you
typically use the “closest center” or “rect intersection” by default. In a free canvas, you might set the
collision detection to pointerWithin (which considers an item “over” a droppable if the pointer is
inside it). By default, <DndContext> uses a sensible algorithm (usually closest center for
sortables). You can override via the collisionDetection prop if needed. For example, to treat
each existing canvas item as an obstacle, you could implement a custom collision algorithm that
checks the new item’s bounding box against others (though dnd-kit doesn’t provide this out-of-the-
box, you can compose or write your own ).
```
## Dragging from Toolbox to Canvas (with 8px Grid Snapping)

**Use case:** You have a sidebar “toolbox” of automation components (nodes) that the user can drag onto a
central canvas. The canvas is a large free-form area (perhaps with a pixel-art grid background). When a tool
is dropped on the canvas, it should appear as a new node, aligned to an 8px grid. The original toolbox item
should remain in the sidebar (we are _copying_ an item into the canvas, not moving it permanently).

**Approach:** We will make each toolbox item draggable, and the canvas a droppable region. When a drag
**ends** , if the drop occurred over the canvas, we create a new element in the canvas state at the drop
position. We’ll use an 8px snap modifier to quantize positions. We also ensure the canvas node bounds are
respected (so items aren’t dropped outside).

Key steps to implement:

```
Wrap with DndContext: In your page or app component, wrap the relevant UI with
<DndContext> and configure needed sensors and modifiers:
```
```
Sensors: Include a pointer sensor for mouse/touch, and add a keyboard sensor for accessibility. For
example:
```
```
import { DndContext, useSensor, useSensors, PointerSensor,
KeyboardSensor} from'@dnd-kit/core';
```
### •

```
5
```
```
5
```
```
6
```
### •

```
7 8
```
```
9
```
### 1.

### 2.


```
import { createSnapModifier} from'@dnd-kit/modifiers';
```
```
constsnapToGrid = createSnapModifier(8);// 8px grid snap
```
```
constkeyboardCoordinatesGetter = (event, {currentCoordinates}) => {
// Custom coordinate getter to move by 8px on arrow keys (instead of
default 25px)
constdelta= 8;
switch(event.code) {
case'ArrowRight': return {x: currentCoordinates.x + delta, y:
currentCoordinates.y};
case'ArrowLeft': return {x: currentCoordinates.x - delta, y:
currentCoordinates.y};
case'ArrowDown': return {x: currentCoordinates.x, y:
currentCoordinates.y + delta};
case'ArrowUp': return {x: currentCoordinates.x, y:
currentCoordinates.y - delta};
}
returnundefined;
};
```
```
constsensors= useSensors(
useSensor(PointerSensor),
useSensor(KeyboardSensor, { coordinateGetter:
keyboardCoordinatesGetter})
);
```
```
Here we create an 8px grid snap modifier and a custom keyboard coordinate getter so that when
using arrow keys, the dragged item moves in 8px steps (matching our grid). We’ll pass
sensors={sensors} and modifiers={[snapToGrid]} to <DndContext>.
```
```
Event Handlers: Provide an onDragEnd handler to handle drops. dnd-kit’s DragEndEvent gives
us event.active.id (the dragged item’s id) and event.over (the drop target info). We can
use these to decide what to do:
```
```
If event.over corresponds to the canvas droppable, we add the item to the canvas.
Otherwise (dropped elsewhere or no drop target), we can ignore or revert.
```
```
We also need the drop coordinates. dnd-kit does not automatically update item positions in state
, so we must calculate the new position. One approach is to track the pointer or transform during
drag; a simpler method is to use the canvas ref and pointer event position. For example, listen to the
pointer position on drop (e.g., via the onDragEnd event’s delta or using a global onPointerUp
on the canvas ). Alternatively, use event.over.rect (the canvas bounding box) plus the
transform to compute the drop point relative to the canvas. For simplicity:
```
```
10
```
### 3.

```
11
```
### ◦

### ◦

```
12
```
```
13
14 15
```

```
constcanvasRef= useRef();
```
```
functionhandleDragEnd(event) {
const{ active, over } = event;
if(over&& over.id ==='canvas-drop') {
// If a toolbox item was dropped on canvas:
if (active.data.current?.fromToolbox) {
const canvasRect= canvasRef.current.getBoundingClientRect();
// Use the last known pointer coordinates (from a ref or
event.pointerDown) and subtract canvas top-left
const x = event.activatorEvent.clientX - canvasRect.left;
const y = event.activatorEvent.clientY - canvasRect.top;
// Snap to nearest 8px
const snappedX= Math.round(x / 8) * 8;
const snappedY= Math.round(y / 8) * 8;
addCanvasNode(active.id, { x: snappedX, y: snappedY });
}
}
}
```
```
In this pseudocode, active.data.current?.fromToolbox is a flag we set on the draggable to
indicate it originates from the toolbox (so we know to copy it rather than move an existing canvas
node). addCanvasNode would update our state (e.g., an array of nodes on the canvas, each with
type/id and position). We used the pointer’s clientX/Y relative to the canvas to determine drop
coordinates and then snapped them. This assumes the canvas occupies a static position on screen;
for a more dynamic layout, using event.delta or monitoring drag movement would be more
robust.
```
```
Toolbox Item as Draggable: For each item in the toolbox list, use
useDraggable({id: itemType, data: { fromToolbox: true }}). The data field is
optional metadata; here we mark the source. Apply the returned props:
```
```
const{ attributes, listeners, setNodeRef } = useDraggable({ id: tool.id,
data: { fromToolbox: true} });
return (
<divref={setNodeRef} {...listeners} {...attributes}
className="p-2 cursor-grab hover:bg-gray-200">
{tool.name}
</div>
);
```
```
Each toolbox item gets a cursor-grab style (Tailwind class for a grabby cursor) and maybe some
hover effect. dnd-kit will automatically handle the drag interactions. During a keyboard drag, hitting
<kbd>Space</kbd> or <kbd>Enter</kbd> on a focused item will start dragging it.
```
### 4.

```
16 17
```

```
Canvas as Droppable: In the canvas component, use useDroppable({ id: 'canvas-drop' })
and set the ref on the canvas container:
```
```
const{ setNodeRef, isOver } = useDroppable({ id: 'canvas-drop'});
return (
<divref={setNodeRef} className="relative w-full h-full bg-[url('/
grid8px.png')]">
{/* Render placed canvas nodes: */}
{nodes.map(node=> (
<NodeComponentkey={node.id} node={node} />
))}
{isOver && <divclassName="absolute inset-0 border-2 border-blue-
border-dashed"/>}
</div>
);
```
```
We give the canvas a relative container and perhaps a tiled background image or CSS (bg-
[url('/grid8px.png')]) to show an 8px grid. When isOver is true (pointer is dragging over
the canvas), we could highlight it (e.g., a dashed border). The nodes array holds current nodes with
their positions; each is rendered absolutely positioned within the canvas (e.g., a <NodeComponent>
that styles itself with style={{ left: node.x, top: node.y, position: 'absolute' }}
or using Tailwind classes for translate-x/y if converted to rems).
```
```
Canvas Node Draggability: Newly added canvas nodes can themselves be draggable (so users can
reposition them later). You can use useDraggable on each <NodeComponent> as well, giving
each a unique id (maybe the same as the node’s id in state). The difference is these draggables
would not be marked fromToolbox; instead, on drag end, if they’re dropped outside the canvas or
simply released, you’d update that node’s coordinates in state. To constrain moves within the canvas,
you can apply a modifier like restrictToParentElement on the DragOverlay or DndContext.
For example, if each NodeComponent is wrapped in a container that is the canvas, using
restrictToParentElement would keep its drag within bounds.
```
```
Snapping to Grid (during drag): We already applied the snapToGrid modifier to DndContext (and
you could also apply it to <DragOverlay> if using one). This ensures that as you drag, the item
moves in 8px increments. The built-in createSnapModifier(gridSize) from @dnd-kit/
modifiers returns a modifier that rounds pointer translations to the nearest multiple of
gridSize. Using createSnapModifier(8) will give the classic “snap to 8px grid” feel in real
time. This pairs well with our final coordinate rounding on drop.
```
```
Drag Overlay (optional): dnd-kit’s <DragOverlay> component lets you render a drag preview
element outside of normal flow, which can improve performance and control style. For example,
when dragging a toolbox item, you might want a styled “ghost” of the node. You would include
<DragOverlay> inside <DndContext> and conditionally render the dragging item inside it:
```
### 5.

### 6.

```
18
```
### 7.

```
19
```
```
20
```
### 8.


```
<DndContext /* ... */>
{/* ... your app ... */ }
<DragOverlaymodifiers={[snapToGrid]}>
{activeId? <NodePreviewid={activeId} /> : null}
</DragOverlay>
</DndContext>
```
```
Here, activeId is from useDndContext() or tracked via onDragStart (the id of the item
currently dragged). <NodePreview> would be a component representing the item’s appearance
while dragging (maybe a semi-transparent clone). Using DragOverlay ensures the dragging item is
rendered in a layer where you can apply CSS transforms without affecting the layout of other
elements. This can be helpful for the canvas: you don’t want your entire canvas reflowing while
dragging a node. Instead, the node’s original position stays put (possibly made invisible), and the
overlay moves. Once dropped, you update state and remove the overlay. This pattern leads to
smoother drags, especially for complex UIs.
```
**Collision Handling (optional):** If you want basic collision detection between nodes on the canvas (to
prevent overlapping placements), you could implement a check in onDragEnd before adding/moving a
node. For example, loop through existing nodes and ensure the new node’s intended position doesn’t
intersect an occupied area (considering each node’s width/height). If it does, you might snap it to the next
free grid cell or prevent the drop. dnd-kit doesn’t have a built-in “no-overlap” enforcement, but you can
utilize its collision detection mechanism creatively. For instance, you could make each node’s area a
droppable and use a custom collisionDetection that returns no collision if an occupied cell is
encountered (forcing the library to find a different drop target or none). A simpler approach: on drop, if
collision is detected, you can adjust the position or reject the drop (e.g., don’t call addCanvasNode). Visual
feedback (like highlighting a node in red if overlapping during drag) would require manual calculation of
overlap on drag move events.

## Sorting a List of Modules (ROI Dashboard Blocks)

The ROI dashboard page likely has a list of modules (widgets) that the user can reorder (similar to Notion’s
draggable blocks or a list of cards). This is a classic sortable list scenario, which dnd-kit’s **sortable preset**
makes straightforward.

**Setup:** Wrap the list in <SortableContext> and render each module with useSortable:

```
State: Suppose you maintain const [modules, setModules] = useState([...]), where
modules is an array of module IDs or objects in their current order.
```
```
SortableContext: Inside DndContext, do:
```
```
<SortableContext items={modules} strategy={verticalListSortingStrategy}>
{modules.map(id => <ModuleCardkey={id} id={id} />)}
</SortableContext>
```
### •

### •


```
Ensure modules (the items prop) is kept in the same order as the rendered list. We use
verticalListSortingStrategy for a vertical list for optimal behavior in this layout. (This
strategy handles collisions and spacing for vertical lists; for a grid of cards, you might use
rectSortingStrategy or a custom strategy.)
```
```
Module item component: ModuleCard will call useSortable({id}). This gives you:
```
```
const{ attributes, listeners, setNodeRef, transform, transition} =
useSortable({ id });
conststyle = {
transform: CSS.Transform.toString(transform),
transition
};
return (
<divref={setNodeRef} style={style} {...attributes} {...listeners}
className="module-card">
...modulecontent...
</div>
);
```
```
We use @dnd-kit/utilities’ CSS helper to convert the transform to a CSS string. dnd-kit will
supply a transition style for smooth movement of items during sorting (so other items slide out
of the way). The attributes include things like role="button" and screen reader text (dnd-kit
sets aria-description for sortable items to announce instructions), and listeners handle
the drag events.
```
```
Handle reordering on drop: Use onDragEnd on DndContext to update module order:
```
```
functionhandleDragEnd(event) {
const{ active, over } = event;
if(over&& active.id !==over.id) {
setModules((prev) => {
const oldIndex= prev.indexOf(active.id);
const newIndex= prev.indexOf(over.id);
return arrayMove(prev, oldIndex, newIndex);// using @dnd-kit/
sortable utility
});
}
}
```
```
This checks if the dragged item (active.id) was dropped over a different item (over.id). If so,
it uses the arrayMove helper to reorder the modules state array. The UI will then re-render in the
new order. dnd-kit’s sortable will have already visually moved the items as you were dragging (using
transforms), so the transition to the final order is usually smooth.
```
```
21 22
6
```
### •

### •


```
Keyboard support (sorting): With the Keyboard sensor enabled (as we did earlier), a focused
module can be picked up with Space/Enter, then use arrow keys to move it. Notably, the sortable
preset has logic to move the item to the next index on arrow press (instead of fixed pixels) by default
```
. For example, pressing the down arrow while a sortable item is lifted will cause it to swap
position with the item below. This is great for accessibility – it uses getNextCoordinates
internally to achieve this.

```
Drag handles and customization: If you prefer that only a part of the module is draggable (like a
“grab handle” icon), you can attach listeners to that sub-element instead of the whole card. Just
ensure you also pass the attributes to a focusable element for keyboard dragging. dnd-kit will
set tabIndex=0 on the draggable by default , but if your module card already has interactive
elements, consider how keyboard focus should work (you might put the draggable on a handle
<button> inside the card).
```
**Styling & Feedback:** You can use Tailwind to style the module cards (e.g., shadow, border on hover). dnd-kit
adds a class dnd-kit-draggable (and similar) which you can target in CSS if needed, but typically you’ll
just apply styles based on state: - Use the isDragging state from useSortable (or from
useDndContext().active matching the item’s id) to conditionally style the dragged item (e.g., hide the
original if using a DragOverlay ghost, or change its opacity). - You can also style the placeholder gap. In a
simple list, the default strategies handle spacing. If you implement custom styling for the placeholder (the
spot where the item would land), you might need to inject an empty element or use CSS to highlight the
over item. In many cases, the movement of items is clear without an explicit placeholder.

## Keyboard Accessibility and A11y Considerations

dnd-kit was built with accessibility in mind: - Draggables are focusable by default (tabindex="0" is
applied). Users can tab to a draggable item and press **Space** or **Enter** to lift it (trigger the drag start)

. Screen reader announcements are provided (you can customize these via the Announcements prop
or the screenReaderInstructions on DndContext). - Once an item is lifted via keyboard, the arrow keys
move it. By default, the movement for free-drag items is 25px per arrow press. We showed earlier
how to override coordinateGetter to use 8px to match our grid. For sortable lists, the arrow keys will
move the item to the next position in list order (which is usually what you want for reordering UX). -
Pressing Space/Enter again will drop the item, and **Esc** cancels the drag (reverting it). - **Focus
management:** After a drop, focus returns to the item in its new position. Ensure your components don’t
unexpectedly unmount/mount in a way that loses focus. In our canvas scenario, if dropping a new node
creates a new component, you might want to call .focus() on that node’s element or otherwise manage
focus for keyboard users. - **ARIA roles:** dnd-kit uses appropriate roles (e.g., role="button" or
role="listitem") and aria-dropeffect. Verify with a screen reader to ensure the experience is
smooth. You can consult dnd-kit’s accessibility guide for best practices.

## State Management and Performance Best Practices

**State Management:** You can manage drag-and-drop state using React’s local state or a global store
(Zustand, Redux) depending on complexity. For example: - The **canvas nodes** could be stored in a Zustand
store for easy sharing between sidebar and canvas components, or locally in a parent component that
contains both. On drop, update this state with new node positions or new nodes. Because dnd-kit doesn’t

### •

```
23
```
### •

```
24
```
```
24 25
17
```
```
26 27
```
```
23
16 17
```

mutate your data, you have full control: in onDragEnd you decide how to update state. This explicit
control is great for integrating with other logic (e.g., you could trigger a save or an AI suggestion when a
node is added). - The **list order** for modules is typically local state (an array of IDs). The arrayMove utility
(from @dnd-kit/sortable) makes it easy to reorder the array on drop.

**Performance Tips:** - **Transforms for movement:** When animating drag, use CSS transforms rather than
repositioning with top/left in state. dnd-kit’s default approach is to compute a transform and you apply it
to the dragged element’s style, avoiding layout thrashing. This is explicitly recommended: “use the
transform CSS property to move your draggable item on the screen, as other positional properties like
top or left can cause expensive repaints”. The library’s <DragOverlay> also leverages
position: fixed and transforms for efficient updates. - **Limit re-renders:** Drag events occur frequently,
so avoid heavy computations in those handlers. Do not update React state on every onDragMove –
instead, let dnd-kit handle the interim positioning and update state **once on drop**. This way, moving an item
doesn’t trigger React reconciler work for each frame. (For example, in the canvas, we don’t set state as the
item moves; we only set it on drop to finalize the new position.) - **Memoize components:** Wrap list items or
node components in React.memo if they accept props, to prevent unnecessary re-renders when siblings
are dragged. In a sortable list, non-dragged items might still re-render due to context updates.
Memoization (or using useSortable’s transform style) helps ensure only minimal parts update. In our
list example, because we applied the transform to style, the item moves via CSS without needing a re-
render for each frame. Only the dragged item and the one currently “over” might re-render as state
changes in context. - **Batch state updates:** If a drop triggers multiple updates (e.g., add a canvas node and
also log an event), batch them or use a single state setter to avoid extra renders. - **Large lists or many
nodes:** If you have a very large list (hundreds of items), consider virtualization (though dnd-kit’s
verticalListSortingStrategy supports virtualized lists ). For a canvas with many nodes,
performance should be fine unless nodes are extremely numerous, since each node is just an absolutely
positioned element (no complex DOM rearranging during drag). - **Touch and scroll** : If your canvas or list is
scrollable, enabling auto-scrolling in DndContext (autoScroll={true} by default) will scroll containers
when dragging near the edges. If using touch devices, apply touch-action: none; to draggable
elements (or their drag handles) to prevent the browser’s touch-to-scroll behavior interfering.

In summary, dnd-kit gives you fine-grained control to build a drag-and-drop UI that feels “native” to your
pixel-grid design and modern UX standards. By using DndContext with appropriate sensors (mouse, touch,
keyboard), defining draggable sources and droppable targets, and leveraging modifiers like grid snapping
, you can achieve precise 8px alignment. The sortable utilities allow intuitive reordering of dashboard
blocks with minimal code. All the while, you maintain control of state updates (dnd-kit won’t implicitly move
your data – you handle it in onDragEnd ), which means you can integrate with external state stores or
side effects (analytics, etc.) easily.

Finally, thanks to dnd-kit’s headless nature, integration with Tailwind CSS and shadcn/UI is seamless. You
simply apply Tailwind classes to style the toolbox, canvas, and nodes as desired – for example, using
shadcn’s prebuilt components (cards, buttons) as the basis for nodes or module items, and enhancing them
with drag handles or icons. Just be careful that the element you apply setNodeRef to is a valid DOM node
(shadcn’s Radix-based components often forward refs properly). With that, you’ll have a performant drag-
and-drop canvas that snaps to your pixel grid and a reordering list that feels like a natural extension of your
design system.

```
12
```
```
28
```
```
6
```
```
29 30
```
```
19
```
```
12
```

**Sources:**

```
dnd-kit Documentation – core concepts of DndContext, useDraggable/useDroppable and
sortable presets.
dnd-kit Modifiers – example of creating a snap-to-grid modifier.
dnd-kit Accessibility and Keyboard – built-in keyboard sensor behavior and focus
management for draggables.
dnd-kit Performance Tips – use of CSS transform for drag performance and notes on state
handling (dnd-kit doesn’t auto-move items).
Stack Overflow / GitHub Discussions – insights on free dragging in a canvas and retrieving drop
coordinates , as well as general usage of onDragEnd for state updates.
```
How to implement drag and drop in React using dnd-kit - DEV Community
https://dev.to/arshadayvid/how-to-implement-drag-and-drop-in-react-using-dnd-kit-204h

DndContext | @dnd-kit – Documentation
https://docs.dndkit.com/api-documentation/context-provider

docs/api-documentation/droppable/usedroppable.md at master
https://github.com/dnd-kit/docs/blob/master/api-documentation/droppable/usedroppable.md

https://dndkit.com – A lightweight, performant, accessible and extensible drag & drop toolkit for React :
r/reactjs
https://www.reddit.com/r/reactjs/comments/kr3qhx/httpsdndkitcom_a_lightweight_performant/

Sortable Context | @dnd-kit – Documentation
https://docs.dndkit.com/presets/sortable/sortable-context

Collision detection algorithms | @dnd-kit – Documentation
https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms

Modifiers | @dnd-kit – Documentation
https://docs.dndkit.com/api-documentation/modifiers

XY Coordinated onDragEnd · clauderic dnd-kit · Discussion #1393 · GitHub
https://github.com/clauderic/dnd-kit/discussions/

Final rect coordinates for draggable in `onDragEnd` event? · clauderic dnd-kit · Discussion #236 ·
GitHub
https://github.com/clauderic/dnd-kit/discussions/

Keyboard | @dnd-kit – Documentation
https://docs.dndkit.com/api-documentation/sensors/keyboard

Draggable | @dnd-kit – Documentation
https://docs.dndkit.com/api-documentation/draggable

### •^21

```
5
```
-^2019
-^2526
    24
-^28
    12
-
    14 13 11

```
1
```
```
2 3 11 12
```
```
4
```
```
5
```
```
6 21 22
```
```
7 8 9
```
```
10 18 19 20
```
```
13
```
```
14 15
```
```
16 17 23 25 26 27
```
```
24 28 29 30
```

