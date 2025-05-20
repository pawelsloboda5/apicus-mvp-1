# Building a Customizable, Theme-Aware UI with

# Shadcn UI and Radix UI in Next.js 15

## Useful Shadcn UI Components for an Automation ROI App

A modern **automation ROI app** with a Notion-inspired, modular interface will benefit from many **Shadcn
UI** components (built on Radix Primitives) to cover common UI patterns. Key components include:

```
Button – Standard clickable button for form submissions, toggling UI, and dashboard actions.
Shadcn’s Button is accessible and easily themed (supports variants like primary, outline, icon-only,
etc.) ensuring consistent interactive styling across the app.
Dialog (Modal) – A modal dialog overlay for confirmations, wizard steps, or settings screens.
Shadcn’s Dialog (built on Radix Dialog) provides focus trapping and accessible markup out of the box
```
. This is useful for **pop-up forms** (e.g. an “Add Module” form or ROI detail view) and any blocking
confirmation (Radix Alert Dialog can be used for critical confirms).
**Tabs** – A tabbed interface to switch between views or steps. For instance, a **wizard-style form** can
use Tabs for each step, or the ROI dashboard might use Tabs to toggle between different data views.
Shadcn Tabs are keyboard-accessible and theme-aware, simplifying multi-step workflows in the app
.
**Tooltip** – Small hover or focus tooltips to provide contextual hints on icon buttons or form labels.
This is essential for a pixel-art style UI where custom icons might need text labels on hover. Radix
Tooltips in Shadcn ensure accessible timing (with delays) and can be styled via Tailwind for light/dark
mode.
**Command Palette** – A **Command** component (Shadcn’s command menu) to implement a quick
action palette (opened with a hotkey, like <kbd>⌘K</kbd>). This allows power-users to search and
execute commands (e.g. navigate to pages, insert a slash command in the editor) quickly. It’s
useful for a Notion-like **slash command popover** where typing “/” brings up insertable blocks.
**Popover and Dropdowns** – **Popover** components provide lightweight, non-modal overlays for
**context menus or small forms**. For example, a slash command menu or a rich text formatting
toolbar can be a Popover. **Dropdown Menu** (built on Radix DropdownMenu or ContextMenu) is great
for **canvas node menus** – e.g. right-click a workflow node to get actions. These come with keyboard
navigation and focus management out of the box.
**Menubar / Navigation Menu** – For a top navigation or a menu bar of actions, Radix **Menubar** and
**NavigationMenu** primitives (available in Shadcn) provide accessible menus with support for
submenus. In a Notion-like app, a Navigation Menu could allow switching between the editor,
ROI dashboard, settings, etc., with proper ARIA roles.
**Form Inputs** – All basic form controls are provided: **Input** (text fields), **Textarea** , **Checkbox** , **Radio
Group** , **Switch** toggles, **Select** dropdowns, and **Combobox** (auto-suggest). These are crucial for
rich forms where users input ROI parameters. Shadcn’s form components come unstyled but easily
**customizable with Tailwind** to match the pixel-art aesthetic while remaining accessible.

```
1
```
### •

```
2 3
```
- 1 • 1 • • 1 • 4 • 4 • 1


```
Slider – For selecting numeric values or ranges (e.g. adjusting an automation parameter or ROI
assumptions with a slider). Radix Sliders are keyboard-accessible and can be styled to match the
app’s theme.
Calendar/Date Picker – If scheduling or time range is needed, Shadcn’s Calendar and Date Picker
provide an interactive calendar pop-up. This could be used to pick project start dates, etc., while
maintaining theme colors.
Card / Hover Card – Use Card for containerizing content in the dashboard modules (each ROI metric
widget can be a Card with pixel-art styling). HoverCard can preview content on hover (e.g. hovering
a workflow node or a reference could show additional info in a small popup).
Accordion/Collapsible – To show advanced settings or FAQ sections in a collapsible manner without
navigation. For example, a sidebar help section could use an Accordion to expand/collapse tips.
Shadcn’s Accordion is built on Radix and provides smooth transitions for show/hide.
Alert/Dialog – For important alerts or system messages, Alert components can show non-modal
messages (like banners), while Alert Dialog is used for confirming dangerous actions (with Cancel/
Confirm).
Toast Notifications – For ephemeral feedback (e.g. “Settings saved”), Shadcn provides a Toast
component (recently superseded by a third-party “Sonner” library). These notifications can
appear at a corner and vanish automatically, keeping the user informed without disrupting flow.
```
Each of these components can be justified by the app’s needs – e.g. a **“Next: See ROI Summary” button**
with a pulse animation (use Button + maybe animate via CSS) , **modals** for wizard steps, **popovers/
menus** for node options, **draggable cards** for dashboard modules, etc. Using Shadcn’s implementations
ensures we have accessible, theme-ready versions of all these elements rather than reinventing them.

## Customizing Shadcn Components (Tailwind, Data Attributes, Slots)

**Shadcn UI components are unstyled by default** , designed to be customized via Tailwind CSS utilities and
Radix data attributes. Here are best practices for tailoring them to a pixel-art, theme-aware
aesthetic:

```
Tailwind Utility Classes: Every Shadcn component accepts a className prop that is forwarded to
the underlying DOM node. Use Tailwind classes to adjust visuals – for example, add rounded-
none pixel-border classes for a pixelated look, or transition-colors duration-200 for
smooth hover transitions. Shadcn often uses class-variance-authority (CVA) to define
variants; you can extend or override these by passing a className or using the provided
variant props (e.g. variant="outline" on Button). If more control is needed, you can copy
the component code into your project (since Shadcn UI is provided as source) and modify the
Tailwind classes or theme tokens it uses. This is a key benefit: you are free to adjust styling at will
without ejecting from the system.
```
```
Radix Data-State Attributes: Radix primitives expose state via data-* attributes on DOM
elements. For example, a Toggle or Accordion item will have data-state="on" or data-
state="open" when active. You can leverage these in Tailwind by using arbitrary selectors.
For instance, to style an open Dropdown item differently, use a class like data-[state=open]:bg-
muted in your Tailwind classes. Tailwind v3+ allows these selectors, so you can define styles that
apply only in certain states (open, closed, checked, etc.). Similarly, Radix sets attributes like data-
disabled, data-highlighted (for menu items being hovered/focused) , data-
```
### • 5 • 1 • 4 • 6 • 6 • 5 7

```
8 9
```
### •

```
10
```
### •

```
9 11
12
```
```
13
```
```
14
```

```
placeholder (e.g. empty Combobox input), etc. Using these, you can style interactive states
without writing custom JS. Example: the Radix Select component focuses the trigger when open, so
you might want to hide the focus ring unless keyboard-focused. You could add a rule for
.SelectTrigger[data-state=open]:focus-visible to tweak focus styles when opened via
mouse vs keyboard (since Radix might focus it programmatically, which triggers :focus-visible
in some cases ). In short, design in CSS as much as possible using these data attributes for state
instead of relying on extra JS.
```
```
Data-Slot Attributes for Styling Parts: In Shadcn’s Tailwind v4 update, every Radix primitive now
includes a data-slot attribute on its parts. This means internal markup (like <span>
icons or container divs) carry a data-slot="name" identifier. You can target these to style
subcomponents. For example, the Select component’s arrow icon might have data-slot="icon",
so you could apply a Tailwind style like [&_[data-slot="icon"]]:text-xl on the parent to
enlarge it (using Tailwind’s group/child selector syntax). This approach keeps you from hacking
element selectors; instead you style by semantic slot. It’s especially handy for complex components
like Calendar or Table – you can assign styles to specific slots (e.g., day cell, header) via CSS. The
data-slot mechanism essentially creates styling hooks into parts of a component that you can
use right in your CSS or Tailwind classes.
```
```
Radix <Slot> and asChild for Composition: Many Shadcn components accept an asChild
prop, which allows you to override the underlying element with your own (using Radix’s
composition utility). For example, you might want a Shadcn Button to actually render as an <a> or
Next.js <Link>. By doing <Button asChild><Link href="/page">Go</Link></Button>,
the button will delegate its props (role, onclick, className) to your Link. This avoids nested buttons/
links and keeps semantics correct. The Radix <Slot> component is used internally to implement
this – it essentially clones the child element with merged props. Use case: in the sidebar menu,
Shadcn’s Sidebar item uses SidebarMenuButton asChild to wrap a Next <Link> , so the
link behaves like the button (highlighted when active, etc.) without extra wrappers. Best practice:
whenever you need a Radix component to use a custom tag/component (like a framework-specific
Link or a custom styled element), reach for asChild instead of reinventing the component. This
maintains all accessibility while letting you inject custom rendering. Just ensure the child passed to
asChild is a single element (no fragments).
```
In summary, Shadcn/UI gives you full control: style with Tailwind classes (even add your own themes/
variants), target Radix’s data attributes for stateful styling, and use composition patterns like asChild to
integrate or swap out elements. This flexibility means you can achieve the quirky pixel-art aesthetic (e.g.
using Tailwind to apply a pixelated font or blocky borders) **without breaking** the underlying accessible
structure.

## Building Custom Components from Radix Primitives (Examples)

Shadcn provides many pre-built components, but you may need **bespoke UI components** beyond the
library’s list. Radix Primitives are low-level building blocks that can be composed to create new components

```
15
16
```
### •

```
17 18
```
```
19 20
```
### •

```
21
21
```
```
22
```

with minimal effort. Two relevant examples for this app are a **canvas node context menu** and a **“slash
command” menu** , which we can construct using Radix primitives:

```
Canvas Node Context Menu: In the workflow canvas (visual automation builder), right-clicking a
node should show a contextual menu (e.g. “Edit node, Delete node, View ROI impact”). Radix has a
ContextMenu primitive that perfectly fits this need. You can wrap each node in
<ContextMenu.Root> with a hidden trigger (or use the node element as the trigger via
ContextMenu.Trigger asChild). Then define the menu in <ContextMenu.Content> with
<ContextMenu.Item> for each action. Radix ContextMenu handles listening for the contextmenu
event (right-click) and opens at the pointer, with full keyboard support (Arrow keys and Esc to close)
```
. To build a custom node menu, you might do:

```
<ContextMenu.Root>
<ContextMenu.Trigger asChild>
<divclassName="node">...nodecontent...</div>
</ContextMenu.Trigger>
<ContextMenu.Content className="menu-content">
<ContextMenu.Item onSelect={editNode}>✏ Edit Node</ContextMenu.Item>
<ContextMenu.Item onSelect={deleteNode}>🗑 Delete Node</ContextMenu.Item>
<ContextMenu.Separator />
<ContextMenu.Item onSelect={viewROI}>💹 ROI Contribution</ContextMenu.Item>
</ContextMenu.Content>
</ContextMenu.Root>
```
This uses Radix’s structure to get accessible roles and states. You can customize it further: use
<ContextMenu.Icon> if available or manually include icons, style the menu via Tailwind (target data-
highlighted on items to style hover, etc. – Radix will set data-highlighted on the focused menu item
). If the design calls for a **radial menu** (circular placement of options), you could still use Radix (for focus
mgmt) but custom-position each Item via CSS transforms in a circle. Overall, building on Radix primitives
ensures your custom menu doesn’t break accessibility while giving you freedom in layout.

```
Slash Command Popover: In a Notion-like editor, typing “/” should pop up a list of blocks or
commands to insert. We can create a Command Menu for this using Radix Popover (or Radix
Combobox for built-in filtering). One approach is to use Shadcn’s Command component which is
designed for search menus. But building manually for learning: use a controlled <Popover> whose
open state is tied to the text input value. For example, listen to the textarea’s onChange; when it
detects a "/" at the caret, set open=true on a <Popover> positioned at the cursor (you might use
a ref to get cursor position or simply position the popover relative to the text input). Inside
<Popover.Content> render a list of options (could be just a <ul> with Tailwind styles, or use
Radix’s more specialized Combobox primitive if available for easier filtering). Each option could be
clickable or keyboard selectable. Radix Popover gives you portalized rendering (so it isn’t cut off by
overflow) and accessible aria roles for the content. To add keyboard support: you can manage arrow
key events to move selection in your list, or leverage Radix Listbox behavior by using <Select> or
Combobox under the hood. In fact, Shadcn’s Command is likely implemented with a cmdk library
that handles fuzzy search and arrow key selection. The goal of using primitives is to handle the
popover positioning and dismissal (Radix will close the popover on Esc or on outside click
```
### •

```
23
```
```
24
```
### •


```
automatically) while you handle the filtering logic. By composing Popover + a simple list, you get a
powerful custom component akin to VSCode’s command palette. Tip: for styling, use Radix’s data-
highlighted on list items (or simply :hover/:focus if using native elements) to highlight the
active option. Ensure the Popover.Trigger is either your "/" key or, more typically, you don’t use a
trigger button at all – instead you control open via state (conditionally render Popover when
needed). Radix Popover supports controlled mode with an open prop and onOpenChange
callback, which you can tie to your slash detection logic.
```
```
Custom Radix Composite Components: Beyond these examples, you might build things like a rich
text editor toolbar (using Radix Toolbar primitive), resizable panels (Radix has a Resizable
primitive in Shadcn) for the draggable sidebar or resizable grid columns, etc. Radix provides
primitives like <HoverCard> for card previews, <ScrollArea> for custom scrollbars on overflow
content, and even a <Resizable/> for splitter panes. By combining these with minimal React
logic, you can construct complex UI pieces. For instance, a drag-and-drop reorderable grid of
dashboard modules might use a third-party DnD library for the dragging, but Radix’s Grid and
AspectRatio (just layout utilities) can help ensure modules snap to a clean grid.
```
When building new components, **start from Radix if possible**. Identify a primitive close to your use-case
(menu, popover, dialog, etc.) and use its accessible foundation. You can always enhance from there (e.g.
wrapping a Radix Toggle inside a custom color-picker component). This approach yields a cohesive UI
toolkit: everything behaves consistently (focus rings, esc to close, etc.) and responds to theme changes
uniformly.

## Integrating Radix State with React 19 Transitions and Next.js

## Streaming

One big advantage of React 19 and Next.js 15 (App Router) is the ability to improve UX with **concurrent
rendering and streaming**. We should integrate Radix component states (open/close events, etc.) with
these features for optimal performance:

```
Non-Blocking UI with useTransition: React’s useTransition lets you mark state updates as
non-urgent. For example, when the user navigates from the canvas page to the ROI dashboard page
by clicking a “See ROI Summary” button, you might trigger a heavy computation or data fetch. Using
startTransition to initiate that state change ensures the button press feedback (like the dialog
closing or button becoming loading) happens immediately, and the expensive update is processed
concurrently. In Radix context, consider a Radix Dialog that triggers a server action : wrap the
state update (e.g. setting openDashboard=true) in startTransition. This way, the dialog can
close and maybe show a spinner without janking the UI, while the Next.js route starts streaming the
new page. Another scenario is a Popover that contains content from a Suspense boundary (perhaps
a lazy-loaded list). If you open it via startTransition, React will show the popover frame
immediately and then populate content as it resolves, rather than blocking the opening. Note: There
is an open issue about useTransition not marking pending when a Radix Popover with Suspense
content opens – essentially, Radix might internally delay the state change, causing the
transition’s pending flag not to behave as expected. A workaround is to control the popover open
state yourself and call startTransition(() => setPopoverOpen(true)), so React knows
about the state change. While this bug is being addressed, controlling the state explicitly can help.
```
### •

```
25
```
### •

```
26
```
```
27 28
```

```
Next.js 15 Streaming and Radix: Next.js App Router can stream HTML in chunks to the client
(especially with React server components and Suspense). Radix components are mostly client-
side interactive primitives; you generally render them in client components (using the "use
client" directive). For streaming, you might render a shell of a Radix component on the server
and hydrate it on the client. For example, render a Dialog’s trigger and an empty
<Dialog.Content> on the server, and stream in some placeholder. Once on the client, you can
fetch actual content and open the Dialog. Because Radix primitives support SSR rendering (no
hydration issues if React 18+ and useId for stable IDs ), you can safely include them in the
initial HTML. One thing to watch: Radix Portals. Components like Dialog, Popover often portal their
content to the body by default. This is fine, but make sure the portal doesn’t break streaming by
trying to attach to <body> before it exists. Radix’s <Portal> utility only renders on the client, so
server-rendered output won’t contain the portal content until hydration. In practice, it means the
initial HTML might not have modal content (which is expected). As long as you ensure the Radix
components are used in client components (or wrapped in a dynamic next/dynamic without SSR),
Next.js will handle streaming other non-interactive parts first, and hydrate Radix components after.
```
```
Using Radix with Server Actions: React 19 introduced things like useFormStatus and server
actions. If you have a form inside a Radix Dialog that triggers a server action on submit, you can tie
that with Radix’s state. For instance, after a successful form submission (server action completes),
you might want to close a Dialog. You can use formStatus.pending to show a loading state in
the Dialog, and then close it when not pending. Because server actions are concurrent, the UI stays
interactive – Radix components can still be opened/closed by the user while the server work
happens. Just ensure any state setting (like dialogOpen = false) triggered by the server action
resolution is done via a transition or deferred effect to avoid blocking the main thread.
```
```
Optimistic UI and Transitions: If the ROI app has actions like “Add node” that immediately reflect in
the UI, you can use Radix’s state to optimistically show it. For example, if clicking "Add node" opens a
Sheet (side panel) with node options, you can optimistically add a placeholder node to the canvas
(using state) while the actual data is being saved, using a transition to avoid blocking the UI. The
Radix Sheet open state can be controlled similarly – perhaps keep it open until the save finishes,
then close with a slight delay so the user perceives a smooth completion.
```
In short, **coordinate Radix UI states with React’s concurrent features** : open/close Radix components in
startTransition if the content is heavy or involves data fetching. This gives immediate feedback (e.g.,
overlay appears) without waiting for content. Then rely on Next.js streaming/Suspense to gradually fill in
the content. The end result is a snappy UI: interactions feel instantaneous, and loading spinners or
skeletons (you can use Shadcn’s <Skeleton> component for placeholders) appear inside Radix containers
until actual content streams in. This approach aligns with the app’s performance goal of “minimal JS
payload, quicker first paint via streaming SSR, no main-thread blocking during interactions”.

### •

```
29
```
```
30 31
```
### •

### •

```
32 33
```

## Theming, Interaction States, and Layout with Tailwind CSS v

Tailwind CSS v4 introduces powerful features that we will leverage for theming and layout in this app’s
design system:

```
CSS Variable Theming (@theme): We adopt a design token approach using CSS custom properties
for light/dark mode. Tailwind v4’s @theme directive allows mapping CSS variables to Tailwind
utilities. For example, we define :root variables like --background, --foreground,
--primary, etc., for light mode, and override them under a .dark selector for dark mode. Then,
in our CSS (probably in globals.css), we include:
```
```
@theme inline{
--color-background: var(--background);
--color-foreground: var(--foreground);
--color-primary: var(--primary);
/* ...etc... */
}
```
```
Tailwind will generate utilities like bg-background, text-foreground, bg-primary, etc.,
based on these theme variables. This means in our JSX we can write <div className="bg-
background text-foreground"> and it will automatically use the correct light or dark value for
those tokens. We follow Shadcn’s token naming convention (semantic names rather than raw colors)
```
- e.g. --background, --card, --popover, --border, --ring (for focus outline),
--primary-foreground, etc., which ensures consistency. Changing the theme (toggling dark
mode or even a high-contrast theme) simply means switching the CSS variables, and all components
update without additional code. Tailwind v4 converting our color values to OKLCH color space
ensures consistent contrast in light/dark variants.

```
Interaction and State Styles: With Tailwind, we make heavy use of variant modifiers for interactive
states: hover:, focus:, active:, focus-visible: etc. For example, buttons might have
hover:bg-primary/90 active:bg-primary/80 focus-visible:ring-2 focus-
visible:ring-ring (where --ring is a semantic token for focus outline color). The focus-
visible pseudo-class is important to avoid showing focus rings when clicking with a mouse; we want
them only for keyboard navigation. All Shadcn components are designed to be navigable by
keyboard, so we ensure our Tailwind styles use focus-visible for outlines. Also consider data-
state variants as discussed – e.g., a Tabs trigger can be styled differently when data-
state="active". Tailwind doesn’t natively know about data-state out of the box, but using the
bracket notation (or a plugin) we can do data-[state=active]:bg-muted to highlight the active
tab. Similarly, aria-selected="true" or data-selected might be used in some components;
those can be targeted with aria-[selected=true]:font-bold for example. Tailwind’s ability to
target parent states with group- and peer states with peer- is also useful. For instance, a form
input might change border color when its sibling label is focused; using Radix Label’s focus
management, you could do peer-focus:text-primary on a label if the input has peer class.
These patterns ensure a highly interactive feel – things like a pulse animation on a button (“Next:
See ROI” button with a glowing pulse to draw attention ) can be done with Tailwind’s animation
```
### •

```
34 35
```
```
36
```
```
37 38
```
```
39
```
### •

```
40
```

```
utilities or custom keyframes (define in tailwind config). The pixel-art aesthetic might also call for
deliberately no transitions on certain hovers (for a choppy retro feel) or conversely, exaggerated
transitions – Tailwind lets us easily toggle transition-none or transition-all as needed per
component.
```
```
Container Queries and Responsive Layout: Tailwind v4 now supports CSS Container Queries,
which let components adapt based on their parent container size, not just the viewport. We can
designate certain wrappers as container elements (e.g., add container class or container-
type: inline-size via CSS) and then use Tailwind’s new variants like @sm:, @md: etc., which
refer to container breakpoints. For example, a dashboard module might display in a single
column when its parent container (say a narrow panel) is below md width. We could write classes
like @md:grid-cols-2 on the container to change a grid layout when the container is medium or
larger. This is useful for the modular ROI dashboard : if a user resizes a panel or if on smaller
screens, the modules can reflow from a 3-column grid to 1-column using container query
breakpoints, ensuring the layout remains usable. Tailwind’s approach is to define container
breakpoints in the theme (often paralleling screen breakpoints, but can be custom), and then use
them similarly to media query prefixes. Enabling container queries might require adding
container plugin or it might be core in v4 – but as per Tailwind v4 announcements, it’s in core and
uses @sm , @lg syntax. We will use this to ensure the app is responsive without heavy media
queries , which complements Next.js’s responsive design.
```
```
CSS Grid and Flexbox Utilities: The Notion-like interface will utilize a lot of CSS Grid for free-form
block arrangement. Tailwind makes it trivial: e.g., a grid for the dashboard with classes like grid
grid-cols-3 gap-4 for a 3-column layout of modules. If we implement drag-and-drop
rearrangement , we can use CSS Grid along with order-* classes or manual inline styles to
reposition items dynamically, or simply manipulate the array order in React state and re-render
(React will handle DOM reordering). Tailwind v4 doesn’t change grid fundamentals, but it may offer
nicer utilities for aspect-ratios and so on (there’s an AspectRatio component in Shadcn too). For a
pixel-art style , we might use very sharp borders between grid cells or a subtle background grid
pattern – easily done with utility classes or an SVG background. The key is that all Radix/Shadcn
components are just normal DOM nodes we can layout with flex or grid. For instance, the Shadcn
Sidebar uses CSS (Tailwind classes) to set width (e.g. w-60 for expanded, w-14 collapsed). We
can adjust those widths, and use Tailwind’s lg: prefixes to have different behavior on mobile vs
desktop (the Achromatic example collapses the sidebar on large screens by default for more content
space ). Tailwind’s grid utilities combined with Radix’s interactive components (like a Drag handle
maybe from a third-party, or just a custom button) will enable the user to drag modules. While
Tailwind doesn’t handle dragging, we can apply classes like cursor-grab active:cursor-
grabbing on draggable elements for proper cursor indication.
```
```
Dark Mode via Classes: We will likely use the class strategy for dark mode (e.g., adding dark
class on <html>). Tailwind then allows utilities like dark:bg-background to apply alternate
styles. However, since we use CSS variables for theme, we often don’t need to litter markup with
dark: variants – the variables handle it. For example, our bg-background class will
automatically apply the dark mode color because under .dark the --background variable is
changed. This is a clean separation: we toggle a parent class for theme, and Tailwind’s
generated classes do the rest. It’s theme-aware design: if tomorrow we add a “high contrast” theme,
we could add a .theme-high-contrast { --background: ...; ... } and as long as that gets
```
### •

```
41
```
```
42
```
### •

```
43
```
```
44
```
### •

```
45 36
```

```
mapped via @theme, all components update accordingly (since they use the semantic classes).
Tailwind v4’s @theme ensures these utility classes exist for custom tokens, which is a big
productivity win.
```
In summary, Tailwind CSS v4 gives us the tools to implement a cohesive theme (light/dark plus custom
accents) and ensure responsive, accessible styling. We will carefully design our theme tokens (taking cues
from Notion and our brand) , and use utilities to enforce consistency (e.g., apply border-border
to all elements by default for a subtle outline ). Interaction states like hover, focus, active will be
designed via Tailwind variants, often enhanced by Radix data attributes. The result is a UI that not only
looks unique (pixel-art + gamified touches) but is also highly usable across devices and input methods.

## Advanced Tips and Common Pitfalls

Finally, here are some **advanced tips and gotchas** when using Shadcn/Radix in a high-performance Next.js
app:

```
Server-Side Rendering and Portals: Radix UI components generally support SSR, but remember
that components which use portals (like Dialog, Popover, Toast) will not render their content until
client-side hydration. If you try to SSR a Dialog that is open by default, the content might not match
between server and client. A safer pattern is to render dialogs closed by default and open them on
the client (or use useEffect to open if needed). Radix’s documentation notes that with React 18’s
improved useId, server/client ID mismatches are resolved , so using Radix with Next 15
(React 19) is seamless. Just ensure to use "use client" where needed (Shadcn components are
mostly client components because they depend on Radix context and event handlers ). If a
component absolutely must render on the server (e.g. an initial UI flash), test it thoroughly for
hydration warnings. For modals and toasts, consider conditionally rendering the Radix content only
after mounted state to avoid any SSR mismatch (since those are transient UI elements).
```
```
Focus Management and focus-visible: As mentioned, Radix will often programmatically focus
elements (e.g., focusing the first menu item when a Dropdown opens). This can trigger the browser’s
focus outline. It’s usually best to use the .focus-visible styles (Tailwind’s focus-visible:) so
that mouse-initiated focus doesn’t show an outline. If you find a case where Radix focuses an
element on open and it causes an unwanted outline, you might adjust by adding a utility class to
suppress outline if using mouse. For example, some devs add a global style like
:focus:not(:focus-visible) { outline: none; } to only show outlines when the browser
determines it’s keyboard navigation. Radix also provides data-focus-visible-added on some
components internally; but using the standard CSS :focus-visible is usually sufficient.
Another quirk: if you have multiple focus traps (e.g. a Dialog inside another Dialog), ensure that only
one is open at a time to avoid focus fighting. Radix handles layering via z-index and focus scopes
well, but it’s good practice to close one before opening another unless truly needed.
```
```
Keyboard Navigation: One reason we chose Radix is its robust keyboard support (tab navigation,
arrow keys in menus, Esc to close, etc.). When you customize or compose components, maintain this.
For example, if you build a custom menu using Radix DropdownMenu, don’t wrap menu items in
additional focusable wrappers that could break arrow key flow. Use Radix’s asChild if you need a
custom item. Test keyboard nav: the user should be able to Tab into the ROI dashboard, use Arrow
```
```
46 47
48
```
### •

```
30 31
```
```
49
```
### •

```
50
```
```
51
```
### •


```
keys to move between interactive widgets (if applicable), and activate buttons via Enter/Space.
Ensure every interactive element has a visible focus state (especially for that pixelated theme –
consider a retro-style focus indicator, but keep contrast in mind). Also, be mindful of keyboard
shortcuts : our sidebar toggle uses a key combo (e.g. Ctrl+B). Radix doesn’t manage global
shortcuts, so implement those via a custom keydown listener (as seen in the Sidebar code) and call
the appropriate state toggles. Just remember to preventDefault appropriately so shortcuts don’t
trigger browser actions (e.g. Ctrl+F shouldn’t accidentally open sidebar).
```
```
Performance Optimizations: This app aims to be high-performance, so consider these tips: use
React DevTools Profiler to ensure Radix components aren’t causing excessive renders. Most Radix
components are lightweight (just some context and event handlers). Avoid unnecessary re-renders
by memoizing where needed, especially for large lists (virtualize long tables or lists if data grows).
Shadcn’s Table and Data Table components can be used for the ROI tables, but if the dataset is
huge, consider a windowing library. Also, tree-shake unused components – since Shadcn is not a
bundled library, you import only what you use. This keeps bundle size minimal. When using icons
(like Lucide icons in Shadcn examples), import individual icons instead of an entire icon pack.
```
```
Known Issues: Stay updated with Radix changes. For instance, an issue was noted where opening a
Radix Dialog directly on a user input event could impact Interaction to Next Paint (INP) because
focus management is synchronous. A tip from experts is to delay opening heavy dialogs slightly
(even using setTimeout or the upcoming scheduler.waitFor API) to yield to the browser
paint. In practice, this means if you have a very heavy modal, you might open it after a tiny delay
so the button click feedback is immediate and then the modal appears a few frames later when
ready. This is a micro-optimization but can improve perceived performance. Also, watch out for
React strict mode double-invocation – Radix is well-tested with Strict Mode, but if you log
something in an effect, you might see it twice in dev. It’s not an issue in production, just something
to be aware of when debugging.
```
```
Drag-and-Drop and Pointer Events: If you implement drag-and-drop for moving blocks, remember
that Radix components (like a Select or Dialog) might conflict if a drag operation is in progress
(because pointer events might get captured). One trick is to add pointer-events-none on
certain overlay elements if a drag is happening behind them, or simply design so that draggables
are not active at the same time as, say, a modal. Radix doesn’t provide DnD primitives, but you can
integrate something like Dragula or Dnd-kit. Just ensure that keyboard alternatives exist (maybe
provide buttons to move items up/down for accessibility, since drag is mouse-centric).
```
In conclusion, by using **Shadcn UI** components and **Radix UI** primitives, customized with **Tailwind CSS v4** ,
we can build a modern ROI application that is theme-aware (light/dark via CSS variables), highly
customizable (pixel-art styling via Tailwind), and performant (leveraging React 19 transitions and Next.js
streaming SSR). This setup yields a Notion-like UX where users can drag modular blocks, open dialogs and
popovers with no lag, and navigate intuitively with keyboard or mouse – all while we maintain full control
over the design. The combination of Radix’s solid accessibility foundation with Tailwind’s rapid styling and
Next.js 15’s architectural improvements positions us to deliver a **fast, polished UI** that feels both fun
(gamified pixel art touches) and professional.

```
52 53
```
### •

### •

```
54
```
### •


**Sources:** Shadcn/UI Documentation ; Tailwind CSS v4 Release Notes ; Radix UI
Documentation ; “Building a Modern Application 2025” Guide ; and other referenced
materials throughout.

Tailwind v4 - shadcn/ui
https://ui.shadcn.com/docs/tailwind-v

Building a CRUD app with Shadcn UI and Refine | Refine
https://refine.dev/blog/shadcn-ui/

Designing an MVP Web App for Automation ROI Calculation.pdf
file://file-XoKpsahtPoWfy5n2Mf9bCi

Styling – Radix Primitives
https://www.radix-ui.com/primitives/docs/guides/styling

How do I use Radix with Tailwindcss? · radix-ui primitives · Discussion #1000 · GitHub
https://github.com/radix-ui/primitives/discussions/

[Select] Can't differentiate if select trigger was focused from mouse or keyboard · Issue #1803 ·
radix-ui/primitives · GitHub
https://github.com/radix-ui/primitives/issues/

2025: A Complete Guide for Next.js 15, tailwind v4, react 18, shadcn | Medium
https://medium.com/@dilit/building-a-modern-application-2025-a-complete-guide-for-next-js-1b9f278df10c

reactjs - How to modify shadcn/ui sidebar to display images in a defined size and menu items in the
same vertical position in both collapsed/expanded states? - Stack Overflow
https://stackoverflow.com/questions/79602872/how-to-modify-shadcn-ui-sidebar-to-display-images-in-a-defined-size-and-menu-
ite

radix asChild understanding : r/reactjs - Reddit
https://www.reddit.com/r/reactjs/comments/1grs4qb/radix_aschild_understanding/

How can the data-[highlighted] state in Radix-Primitives be triggered?
https://www.reddit.com/r/reactjs/comments/1du6keo/how_can_the_datahighlighted_state_in/

Make Your React App Lightning Fast with useTransition! | by Komal ...
https://javascript.plainenglish.io/make-your-react-app-lightning-fast-with-usetransition-026ce

transition / suspense broken with Popover (and propably Dialog, DropdownMenu ect) · Issue #3376 ·
radix-ui/primitives · GitHub
https://github.com/radix-ui/primitives/issues/

App Router: Streaming - Next.js
https://nextjs.org/learn/dashboard-app/streaming

Server-side rendering – Radix Primitives
https://www.radix-ui.com/primitives/docs/guides/server-side-rendering

High‑Performance Design System Guide (React 19 + Next.js 15).pdf
file://file-8pEnVWCLL8qSAQMnfV6nnQ

```
1 55 36 56
9 11 57 36
```
```
1 4 5 6 17 23 25 39 55
```
```
2 3
```
```
7 40
```
```
8 9 10 11 12
```
```
13 16
```
```
14 15 50
```
```
18 19 20 36 45 48 57
```
```
21
```
```
22
```
```
24
```
```
26
```
```
27 28
```
```
29
```
```
30 31
```
```
32 33 37 38 47
```

Theme variables - Core concepts - Tailwind CSS
https://tailwindcss.com/docs/theme

Open-sourcing our progress on Tailwind CSS v4.
https://tailwindcss.com/blog/tailwindcss-v4-alpha

Using the new Shadcn Sidebar - Achromatic
https://achromatic.dev/blog/shadcn-sidebar?ref=bic

High‑Performance Design System Guide (React 19 + Next.js 15).pdf
file://file-78H1ni88awLvX5kSrTJhzR

ShadCN as a Server Component : r/nextjs - Reddit
https://www.reddit.com/r/nextjs/comments/1bnxtr4/shadcn_as_a_server_component/

focus-visible - CSS: Cascading Style Sheets - MDN Web Docs
https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible

How To Improve INP: React⚛ | Jacob 'Kurt' Groß
https://kurtextrem.de/posts/improve-inp-react

```
34 35 56
```
```
41 42
```
```
43 44 52 53
```
```
46
```
```
49
```
```
51
```
```
54
```

