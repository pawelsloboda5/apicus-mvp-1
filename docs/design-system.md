# High‑Performance Design System Guide (React + Next.js 15)

This guide outlines a design system that blends a **pixelated/gamified aesthetic** with a clean, professional
layout inspired by Notion. It covers visual theming (light/dark mode), UI component patterns, Tailwind CSS
v4 usage, interaction states, and performance best practices for React 19 and Next.js 15. The goal is an
implementation-ready reference for building a fast, polished web app UI.

## Pixel Aesthetic Guidelines

### Iconography

| Guideline              | Spec                                                                                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Grid & Sizing**      | Design every icon on a **16 × 16 px grid** (multiples scale cleanly to 32 px, 48 px). Align strokes to the pixel grid—no sub-pixel anti-aliasing.                                       |
| **Stroke & Fill**      | Use a **single-pixel stroke** (1 px at base size). Filled shapes must land exactly on the grid—avoid fractional coordinates to keep crisp edges.                                        |
| **Style family**       | Flat, no inner shadows or gradients. Corners 90° or 45° only; circles rendered as rough 8-bit circles. Think *Figma "RetroBits"* set.                                                   |
| **Color usage**        | Default icon color inherits `--foreground`. When placed on accent backgrounds (`--primary`, etc.), switch to `--background` for contrast.                                               |
| **Interaction states** | Hover: lighten icon 5 % (`opacity-90`). Active: nudged down 1 px to mimic "pressed" arcade button. Focus: 2 px ring in `--ring`.                                                        |
| **Implementation**     | Keep icons as local SVGs in `/assets/icons/pixel/`. Create a React `<PixelIcon name="check" size={24} />` wrapper that snaps to the grid with `inline-flex w-[size] h-[size] shrink-0`. |

### Typography

| Use-case                                                                   | Font stack                                                                                                                                                               | Size / rhythm |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| **Primary UI**                                                             | `Inter, ui-sans-serif`—clean for long text blocks (retains the Notion-like feel).                                                                                        |               |
| **Gamified/Accent text** (XP counters, badge labels, Easter-egg headlines) | `Press Start 2P, monospace` (Google Fonts) or `Pixelify Sans`. ***Use sparingly***—only for short strings to avoid legibility issues.                                    |               |
| **Numeric readouts** (score, timers)                                       | `VT323, monospace`—monospaced digits avoid jitter.                                                                                                                       |               |
| **Baseline grid**                                                          | Stick to the 8 px / 4 px modular scale already in the design guide—e.g., body `1 rem`, H2 `1.5 rem`, aligning line-heights to multiples of 4 px to preserve pixel snap.  |               |

### Color Palette

| Token                           | Light mode                                                                                                                                                  | Dark mode                        | Pixel-art note                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| `--background` / `--foreground` | #FFFFFF / #1F1F1F                                                                                                                                           | #2F3438 / #F1F1F1                | Neutral, keeps the board "clean canvas."                                                |
| `--primary`                     | **Teal 600** `#0FB5BA`                                                                                                                                      | Teal 400 `#1BC9CF`               | Limiting the primary accent to a *single vibrant hue* mimics 8-bit palettes.            |
| `--secondary`                   | **Purple 500** `#8B5CF6`                                                                                                                                    | Purple 400 `#A78BFA`             | Good for badge borders, progress bars.                                                  |
| `--success / warning / error`   | Green 600 / Orange 500 / Red 500                                                                                                                            | Green 400 / Orange 400 / Red 400 | Match each with one darker variant for "pressed" states (shift OKLCH lightness −10 %).  |
| **Dither overlay**              | Optional 4 % opaque checkerboard SVG (`url('/img/dither.svg')`) you can apply via `bg-[url('/img/dither.svg')] bg-repeat` on hero sections for retro flair. |                                  |                                                                                         |

#### Palette principles
1.  12-color hard cap – classic NES palettes maxed at 12; staying under that forces consistency.
2.  Flat steps – avoid subtle gradients; instead jump in 10 % OKLCH lightness increments.
3.  Contrast ratio – maintain WCAG AA between foreground and its fill (≥ 4.5:1). The neutral base in the PDF already passes.

### Example Implementation
```jsx
/* Example: Pixel-styled "Save" button */
<Button
  className="
    inline-flex items-center gap-2 rounded-sm       /* sharper corners */
    bg-primary text-background hover:bg-primary/90  /* pixel palette */
    active:translate-y-px active:shadow-none        /* arcade press */
    focus:outline-none focus:ring-2 focus:ring-ring
    px-4 py-2 font-pixel text-sm tracking-tight
  "
>
  <PixelIcon name="floppy" size={16} />
  Save
</Button>
```

### Checklist for Developer Hand-off
- Icon kit exported as grid-aligned SVGs (16 px base).
- Pixel font tokens added to tailwind.config.js (fontFamily.pixel).
- CSS variables for light/dark palettes updated (:root / .dark).
- Global utility classes (.pixel-border, .pixel-shadow) registered.
- Documentation snippet above placed in design-system.md > Pixel Aesthetic

## Color Palette (Light & Dark Modes)

**Neutral Base and Contrast:** Use a neutral color foundation for both modes. In light mode, the main
background is near-white (e.g. #FFFFFF or a soft gray) with dark text; in dark mode use a deep gray-blue
(e.g. Notion's dark #2F3438 for content background) instead of pure black to reduce eye strain. The
sidebar/background panels can be differentiated with slight tonal differences (Notion uses an off-white
#F7F6F3 sidebar in light mode, and a lighter gray #373C3F sidebar in dark mode for subtle contrast
).

**Accent Colors:** Introduce a limited set of vibrant accent colors to support the gamified feel without
overwhelming the neutral base. Define a primary brand color for interactive elements (buttons, links,
highlights) and ensure it has sufficient contrast on both light and dark backgrounds. For example, a bright
**blue or purple** could serve as the primary accent, with lighter/darker variants for hover or dark mode.
Secondary accents (e.g. a success green, warning orange, error red) should also be defined for status
indicators. Each accent should have a corresponding contrast color for text or icons on that background (for
instance, light text on a saturated accent).

Example: Primary – a vibrant teal in light mode (for buttons, links) and its 90% lighter counterpart as
text on dark backgrounds; Secondary – a purple or gold for gamified elements (like badges or XP
progress), with appropriate light/dark variants.

**Semantic Palette & CSS Variables:** Follow shadcn/ui's token convention to name colors by purpose. Use
semantic tokens like --background, --foreground (for base UI), --card, --popover, --border,
and --ring (focus outlines), as well as --primary, --secondary, --accent, etc., each with a *-
foreground counterpart. In light mode, for instance, --background might be oklch(1 0 0)
(white) and --foreground a near-black oklch(0.145 0 0) (deep charcoal). In dark mode, these
flip: --background becomes a very dark color and --foreground a near-white. Using CSS custom
properties ensures theme consistency: you define the palette once and let Tailwind's utility classes (like bg-
background text-foreground) apply the appropriate colors per mode.

**Typography:** Choose a clean, legible sans-serif font (e.g. **Inter** , which Notion and modern UIs favor for its
neutrality). Typography should scale consistently – define heading sizes (H1, H2, etc.) and body text based
on a modular scale (perhaps 1rem base for body, up to ~1.5–2rem for H1). Embrace an **8px/4px grid** for
font sizing and line-heights to align with the pixel aesthetic (ensuring sizes round to neat .25rem

```
1
```
```
1
```
```
2 3
```
### •

```
4 5
6
3
```
```
7 8
```

increments). In dark mode, use slightly lighter font weights or higher letter-spacing if needed to maintain
readability on dark backgrounds. Ensure text color uses the --foreground token, which in dark mode
becomes a light gray rather than pure white for comfortable contrast.

_Implementation tip:_ Use Tailwind's font and text-size utilities (e.g. font-sans text-base md:text-lg)
and include a CSS reset or the shadcn "typography" styles for consistent default <p> , <h*> styling. Limit
fonts to one or two families (e.g. a sans-serif for UI and maybe a monospace or pixelated font for special
gamified counters) to maintain a professional look.

## Layout & Component Patterns (Notion + shadcn/ui Influences)

**Clean, Content-Focused Layout:** Structure pages with a minimal chrome so user content stands out (a
hallmark of Notion's UX). Use ample white space and an organized grid. For example, a typical layout might
include a collapsible sidebar for navigation, a top header bar, and a scrollable content area – similar to
Notion's sidebar + content panel. Implement a responsive design that can switch from a multi-column
layout to single-column on mobile. Tailwind's grid and flex utilities enable this: e.g. a parent md:grid
md:grid-cols-[auto,1fr] for sidebar + content, falling back to flex-col on small screens.

**Blocks and Modular Components:** Emulate Notion's _block-based_ design by building the UI from modular
components that stack or nest. In practice, every piece of content or functionality can be a "block"
component (text block, image block, card, etc.) arranged vertically with consistent gaps. Utilize shadcn/ui's
pre-built components and "building blocks" as a starting point – e.g. a **card** component for grouped
content, or a **data table** block for lists. These blocks should share consistent padding and border
radius so the interface feels cohesive (for instance, all cards might use rounded-lg and a subtle border
in light mode or border-white/10 in dark mode). Notion's influence means keeping these block borders
and separators very light (low contrast) to maintain a clean look.

**Notion-Like Interactions:** Notion's UI reveals contextual options on hover (e.g. a block handle or plus
button). We can adopt this pattern for advanced editing or gamified features: for example, show a small
"edit" icon when hovering a card, or a drag-handle for reordering list items. Keep these controls subtle and
hidden until needed to avoid visual clutter. Using Tailwind, you might add classes like opacity-0 group-
hover:opacity-100 transition-opacity on such controls, and wrap the block in group to toggle
on hover. Additionally, implement keyboard-friendly features that Notion excels at: global **command
palette** (shadcn/ui's Command component) for quick actions and navigation, and **slash menu** for inserting
new blocks. These patterns improve efficiency for power users and can be built using accessible primitives
(e.g. a popover list triggered by ").

**shadcn/ui Component Integration:** Leverage the shadcn/ui library for accessible, themeable components
out-of-the-box. These include essentials like dialogs, menus, tooltips, etc., which match our design tokens.
For instance, use the **Dialog** from shadcn for modals (pop-ups will automatically use our colors and radius),
and the **Dropdown Menu** or **Context Menu** for right-click or overflow menus. Shadcn's components are
built on Radix UI primitives, meaning they come with proper accessibility and state hooks. The design
system should specify usage guidelines for each: e.g. _Use a Tooltip on icon buttons to provide labels on
hover; use Popover for rich drop-down content like Notion's emoji or color pickers._ All such components
should align with our theme – thanks to shadcn's CSS variables, they will by default if we configure
baseColor and include the styles. When custom styling is needed, prefer Tailwind utility classes or data

```
9 10
```

attributes over raw CSS for consistency. (Shadcn components expose className slots and data-state
attributes; for example, one can add className="rounded-md border" to the Calendar component to
adjust its style .)

**Responsive and Adaptive Design:** With Tailwind v4's new **container queries** , we can make components
adapt based on their parent container size rather than global breakpoints. This is useful for a block system –
e.g. a "card" might display a compact summary layout if placed in a narrow sidebar (small container) versus
a detailed layout in a wide content area. Utilize the @container rules in Tailwind (e.g. apply
md:text-xl at a certain container width) to ensure the UI retains the gamified pixel-art charm even in
small spaces. This approach aligns with modern CSS and keeps the design system future-friendly.

## Tailwind CSS v4 Best Practices (Spacing, Layout, Shadows, Borders)

**8px Grid & Spacing Scale:** Design all spacing (margins, paddings, gaps) on an 8px base grid for pixel-
perfect alignment. Tailwind's default spacing scale (e.g. p-2 , p-4 , p-8 corresponding to 0.5rem, 1rem,
2rem) is effectively 8px increments and can be used consistently. For fine adjustments or tighter UI
elements, 4px steps (like p-1 or p-1.5) maintain the pixel aesthetic. Document standard spacings for
common use: e.g. card inner padding = 16px (p-4 ), section margin = 24px ( mt-6), etc., so the team
applies these uniformly.

**Flex and Grid Layouts:** Use CSS Grid for high-level page layouts where content areas need explicit
positioning (e.g. a dashboard with a sidebar and header). Use Flexbox for simpler alignment tasks (nav bar
items, buttons with icons, etc.). Tailwind utilities cover both: classes like flex items-center center
content in a header, while grid grid-cols-3 gap-4 lays out a three-column panel. Ensure that layout
classes are mobile-first and responsive – e.g. flex flex-col md:flex-row to stack on mobile and
horizontal on desktop. Also consider **CSS flexbox gap** (Tailwind's gap-*) to consistently space elements
instead of manual margins, preserving the grid rhythm.

**Borders and Dividers:** Embrace subtle **borders** to delineate components, akin to Notion's light dividers
between elements. A 1px border (border utility) in a very light gray (border-neutral-300 in light
mode, or border-neutral-800 in dark) works well for card outlines or separating list items. Tailwind's
color tokens can be customized; our design tokens (e.g. --border) will be mapped to such utilities. For
example, define --border as a neutral (like oklch(0.922 0 0) which is a light gray ) and Tailwind
class border will use it via the bg-border if using CSS vars. We should also use divide-y or
divide-x utilities for list separators rather than manually adding dividers, to keep DOM clean.

**Shadows and Elevation:** Apply shadows sparingly for depth (Notion mostly avoids heavy shadows; our
gamified twist might allow a bit more playfulness). Tailwind offers shadow-sm, shadow-md, etc., and
even _colored_ or _layered_ shadows if needed for a retro effect. For a subtle effect, use a small y-offset shadow
with low opacity (e.g. shadow-md shadow-neutral-500/10) on modals or popovers to pop them off the
background. Tailwind v4 introduces **complex shadows** and expanded gradient utilities , so we can
create multi-layer pixelated shadows if desired (e.g. two shadows to mimic a 2D "drop" effect for a gamified
look). Define a standard shadow for: cards (maybe none or shadow-xs to keep flat), modals (shadow-
lg ), and hover states ( shadow-sm on hover for interactive cards).

```
11
```
```
12
```
```
13
```

**Border Radius:** The "pixel" aesthetic leans toward sharper corners, whereas modern UIs use some
rounding. We'll strike a balance with **small to medium border-radius** on surfaces. For example, use
rounded-md (~4px radius) for buttons and inputs to avoid a harsh 0px corner, while still keeping a slightly
blocky feel (Notion's components also have subtle rounding). Larger containers like modals or cards can use
rounded-lg (8px). Document these choices so developers consistently apply the right utility (rounded,
rounded-sm, rounded-md etc.). Note that the design tokens include a --radius variable for global
corner radius if we want to tweak it easily. If a more gamified style is desired in parts of the UI (like
avatar images or special widgets), we could intentionally use no rounding (rounded-none) to create a
pixel-art square look as a contrast – but do so sparingly and with purpose.

**Tailwind Theme and New Features:** Tailwind v4 brings powerful features we should utilize: - **CSS Variables
and Themes:** Tailwind now exposes design tokens as CSS vars and allows customizing them directly in CSS

. We've configured our color palette via shadcn's system, so continue to use those rather than hard-
coded hex values. If needed, use Tailwind's new @theme directive to define theme-specific styles in CSS
(e.g. @theme light { ... } @theme dark { ... } for any overrides). - **Container Queries:** Use
the built-in container query utilities to ensure components gracefully adapt. For example, a navbar might
collapse its menu when its container (perhaps a parent card) is below a certain width. Use classes like
@container sidebar and then in CSS or with Tailwind variants sidebar-lg:text-base to adjust text
if the sidebar is wide (shadcn's example uses @container named queries for responsive cards ). -
**Pseudo-classes & New Variants:** Take advantage of new Tailwind variants such as the not-[] selector (to
style an element when another state is not present) and the @starting-style variant for transitions
(discussed below in interactions). These allow cleaner styling of complex states without extra classes or JS.
For instance, we might use starting:opacity-0 on a toast notification so it can fade in smoothly when
it appears, using pure CSS for the entrance animation. - **Performance optimizations:** Tailwind v4's
engine is much faster (Rust-based) and supports LightningCSS. This doesn't directly affect design, but it
means using many utilities and even adding custom ones won't bog down build times. So we can
comfortably utilize Tailwind for granular styling (e.g. fine-tuning a pixel art effect with multiple shadows or
background layers) without performance concerns.

## Interaction States & UX Transitions

All interactive components should have clear, polished state feedback. Below are standard interaction states
and our design system's approach to each:

```
Default State: The base appearance of a component. Ensure sufficient color contrast (especially for
text on buttons, etc.) in this state. Use our primary colors for primary actions and neutral colors for
secondary/minor elements.
```
```
Hover: On hover, provide a subtle visual cue. This could be a slight increase in background
brightness for dark backgrounds or a light gray highlight for light backgrounds. For example, a
button might go from bg-primary to a slightly lighter variant on hover, or a card might lift with a
small shadow. Use Tailwind's hover: classes for this (hover:bg-primary/90, hover:shadow-
sm , etc.). Keep hover effects non-jarring – avoid large shifts or excessive movement that would
break the professional feel. A 3-5% color lightening or a small translateY is enough to signal
interactivity. Notion's approach is minimal (e.g. just an underline on hover for links or slight
background for list items), which we emulate for most elements.
```
```
6
```
```
14
```
```
15
```
```
16
```
```
17
```
```
18 19
```
```
20 21
```
### •

### •


```
Focus: For accessibility, focused elements (via keyboard navigation) must have a visible focus ring.
Use a Tailwind ring utility that ties into our theme, e.g. focus:ring-2 focus:ring-primary
focus:ring-offset-2. In light mode, a focus ring could be a blue glow or a dark outline around
light components; in dark mode, perhaps a light outline. Shadcn's default uses a --ring variable
(an OKLCH color) for focus outline which we can customize. Ensure the focus style does not get
disabled; even if we have a custom design, we want at least a 2px outline or an evident shadow so
users can see what's focused. For example, a focused button might show a faint cyan border or glow
that complements the pixel aesthetic (imagine the old-school game UI focus highlight).
```
```
Active/Pressed: When a button or interactive element is being clicked or long-pressed, give a quick
tactile feedback. This can be a slight "press in" effect – e.g. darker background and y-offset shadow
removed (to look pressed). Tailwind can do this with
active:bg-primary/80 active:translate-y-px. Keep the duration short (100–150ms) so it
feels snappy. For toggles or switches, the active state might immediately reflect as the "selected"
state (see below).
```
```
Disabled: Disabled elements should visually appear inactive. Reduce opacity (e.g. opacity-50)
and remove interactive styles (no hover or focus ring). Also change cursor to not-allowed for
clarity. For form inputs, using Tailwind's disabled: variant can apply a muted background
(disabled:bg-muted) and muted foreground text (text-muted-foreground) consistent with
our theme tokens. The goal is that disabled buttons, controls, or blocks are clearly "turned off"
yet still legible. Typically, text in a disabled state might be a mid-gray on a lighter gray background in
light mode (and vice versa in dark).
```
```
Selected / Toggled: For elements that can be selected or toggled on (think tabs, toggled buttons,
menu items, or even selected blocks in an editor), use a distinct background or outline to indicate
selection. This could be a soft highlight using our accent color or a stronger border. For example, a
selected sidebar item might have bg-secondary with text in text-secondary-foreground for
contrast. Ensure the contrast is enough that at a glance the selected item stands out. When
multiple items can be selected (multi-select lists, chips), also include an "selected" icon or checkmark
if appropriate for clarity. Animations can be subtle: e.g. when a card is selected (clicked), fade in a
colored border (transition-colors over 150ms) so it doesn't abruptly change.
```
```
Loading (Async Pending): When an action is in progress, provide feedback to the user. For global or
section-loading, use skeletons or spinners. Shadcn/UI offers a Skeleton component for
placeholder loading states of text or cards. For instance, when a page of data is loading,
show gray blocks or lines where content will be (this keeps the pixel style, as Notion does with gray
blocks when loading content). For actions like form submission or button click, change the button
text to a loading state or show an inline spinner icon. A common pattern is disabling the button and
swapping its label to a spinner (using something like <Button disabled>Loading...</
Button>). With React 19, we can easily track such states using useTransition: wrap the action
in a transition so React sets an isPending flag. For example, when a user triggers a save, use
startTransition() and conditionally render a spinner or "Saving..." text while isPending is
true. This ensures the UI remains responsive and clearly indicates the in-progress state. Once the
async work completes, the UI returns to normal, perhaps flashing a success message.
```
### •

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
5
```
### •

```
24 25
```
```
26
```

```
"Connected" State: If the app has the concept of connections (e.g. a live sync, online status, or an
external service connected), use clear icons and color cues. For instance, a green dot indicator for
"online/connected" vs a gray or red for "offline/disconnected". A "Connect" button might change its
label and style to "Connected" when active, using our success color for emphasis. Ensure this state is
also reflected textually (for accessibility) – e.g. an aria-label "Status: Connected". Visually, a slight
pulse animation on a connected icon (if it's something like a live feed) can add polish. However, avoid
excessive animation; a steady state or gentle pulse is enough to catch attention in a gamified way
without being distracting.
```
```
Async Transition States: Beyond loading, consider intermediate states like optimistic updates or
partial form states. For example, when an async action is initiated, we might optimistically update the
UI (immediate feedback) then correct if needed. Using React 19's concurrent features, we can keep
the UI interactive during async ops. Use useTransition for non-blocking updates , as
mentioned, and perhaps use useDeferredValue for content filtering/search UIs so that typing
doesn't lock up the interface (this defers expensive filtering until the user stops typing, improving
perceived performance). These transitions should be accompanied by subtle visual cues: e.g. dim out
content while new data loads, or a loading bar at top (like a thin progress bar) for page transitions.
Next.js 15 supports streaming SSR and selective hydration , so we can leverage that for async page
loads – e.g. show a partial page (skeleton or header) instantly and stream in the data results when
ready. Ensure any placeholder or interim states are styled consistently (perhaps using our --
muted color for skeleton backgrounds, etc.).
```
**Animations & Transitions:** All state changes should be animated for smoothness, using CSS transitions
where possible. Tailwind's utility classes (like transition-colors, transition-opacity,
duration-150) make it easy to add basic animations. For more complex motions (modals, drawers),
utilize CSS keyframes or a library if needed, but prefer simple scale/opacity transitions to align with the
lightweight feel. Tailwind v4's @starting-style support lets us define entry transitions purely in CSS

- e.g. we can have a dropdown menu use starting:scale-95 starting:opacity-0 and a normal
state of opacity-100 scale-100 with a transition, so it animates in without JavaScript when added to
the DOM. Use this for things like fade-in modals or slide-in sidebars to enhance UX polish.

Finally, ensure **consistency** in how states are represented. Document the exact classes or CSS for each state
in our component documentation (for instance: "Button: hover = lighten 5%, active = darken 10% and inset
shadow, disabled = 50% opacity, focus = 2px solid focus-ring color"). This gives developers a clear recipe to
implement states correctly.

## Theming and Mode Toggle Integration

Our design supports instant switching between **Light and Dark modes**. We'll implement theming through
a combination of CSS variables and Next.js utilities:

**CSS Variable Theming:** As set up in shadcn's system, all key colors and design tokens are defined as CSS
variables on :root for light mode, and overridden under a .dark class for dark mode. This means
our components automatically adjust when the theme changes. For example, --background flips from a
light value to a dark value, --foreground from dark text to light text, etc., without manually toggling

### •

### •

```
27
```
```
19
```
```
3
```

every style. We ensure any custom CSS or overrides also use these tokens (e.g. if a custom component has a
special background, define it using our palette like var(--accent) so it switches appropriately).

**Next.js Theme Toggle:** Use the **next-themes** package to manage theme state. We create a
<ThemeProvider> (as shown in shadcn docs) at the root of our app that enables system color scheme
detection and provides a toggle mechanism. We configure it with attribute="class" so it adds
a class="dark" on the <html> tag in dark mode (and removes it for light mode). This triggers our
CSS variable overrides for dark theme. The provider's defaultTheme="system" and enableSystem
options ensure that on first load we match the user's OS preference. We also set
disableTransitionOnChange to avoid CSS transitions playing when toggling themes (preventing a flash
of weird intermediate colors).

**Mode Switch UI:** Provide a clear toggle in the UI for users to switch modes. A common pattern is a button
with a sun/moon icon. Using shadcn's Switch or a custom toggle, we can swap the theme on click. This
toggle should be available in a consistent spot (e.g. top-right user menu or settings). We'll use the theme
provider's context or the useTheme() hook (from next-themes) to implement the toggle. When clicked, it
updates theme to "dark" or "light", causing the <html> class to update and all CSS vars to change. The
transition should be seamless – thanks to our variable approach, the UI recolors instantly. We avoid full
page reload or heavy re-render; next-themes handles it client-side without affecting SSR.

**shadcn/ui Integration:** All shadcn components are built to be theme-aware via the CSS vars. By toggling
the .dark class on root, we automatically get dark-mode styles for menus, dialogs, etc. (e.g. the
dropdowns will use --popover which in dark is a dark gray, etc.). We should test each component in both
modes to fine-tune any specific issues (for example, ensure the default shadows or borders look good
against dark backgrounds – adjust --border or --shadow vars if needed specifically for dark). If we
need additional theme customizations beyond colors (like different spacing or radius in dark mode, though
usually not needed), we could use the dark: variant in Tailwind for those exceptional cases.

**Theming Extensibility:** While our default theme is a Notion-like neutral, the system is set up to allow
additional themes (perhaps seasonal or further gamified skins). Shadcn's framework even allows defining
multiple theme palettes (they provide "New York", etc.). In our config, baseColor is currently neutral; we
could create a variant with a different baseColor (e.g. slate or a custom palette) for special use-cases.
The infrastructure (CSS vars + .dark overrides) would remain the same; only the values in :root would
differ. For now, we focus on the primary light/dark, but it's good to note that adding another theme would
mean adding another class (like .theme-alt { --background: ... }) or using data-attributes, and
the components can swap by changing that attribute on a parent.

In summary, the theming model ensures **one-click mode switching** and **consistency** : developers don't
need to write separate styles for dark mode in most cases – just use the tokenized colors, and the theme
system does the rest.

```
28 29
29
```
```
29
```
```
29
```

## React 19 + Next.js 15 Performance Patterns

To achieve a snappy, high-performance UI, our design system pairs with modern React/Next features. Here
are best practices and patterns to follow:

```
Server Components & Client Components: Next.js 15 fully supports React Server Components
(RSC). Leverage this by keeping as much UI rendering on the server as possible. Pages and heavy
UI pieces (data-heavy lists, markdown rendering, etc.) should be implemented as Server
Components , which don't ship JavaScript to the browser. Use Client Components only for
interactive widgets and stateful elements (forms, buttons, drag-drop, etc.). This division (often file-
based with the 'use client' directive for client modules) ensures minimal JS sent to the client,
improving load performance. It also lets the server handle heavy work (filtering, data combining) so
the client stays responsive. When designing components, think: Can this be a server component? If
it doesn't need browser APIs or live interactivity, it probably can. For example, a read-only data table
or a static content block can be server-rendered, whereas a real-time collaborative widget would be
client-rendered.
```
```
Lazy Loading & Code Splitting: Avoid including large components or libraries in the initial bundle if
they aren't immediately needed. Next.js provides dynamic imports (next/dynamic) to code-split
on a component basis. Use this for things like modals, heavy charts, or editor components that can
load on demand. According to Next.js docs, lazy loading decreases the JS needed initially by
deferring non-critical components. For example, if your app has a big chart (using a library) that
is hidden behind a tab, import it dynamically so it loads only when the user navigates to that tab.
Implement lazy loading in two ways: using next/dynamic(...) for components, or
React.lazy with <Suspense> for non-Next contexts. Remember that Server Components
are already code-split and streamed by default in Next 15 , so "lazy loading" mainly concerns
Client Components. By following this, we reduce time-to-interactive on first load. Always provide a
fallback UI for lazy content (Next's dynamic import allows a loading: ()=> <Spinner/> option)
so the user sees a spinner or placeholder instead of nothing while it loads.
```
```
Streaming SSR with Suspense: Next.js 15 supports streaming server-side rendering using React
18/19's Suspense. This means we can send parts of the HTML to the client as soon as they're ready,
without waiting for all data. To utilize this, wrap slower data-fetching components in <Suspense>
boundaries with a lightweight placeholder. For example, the page's main content could suspense-
wrap a component that fetches large data, showing a skeleton immediately while the real content
streams in moments later. React 19 even introduced the use() hook to simplify fetching in server
components and seamlessly suspend until data is resolved. When using use(), React will
send partial HTML down and hydrate incrementally – this selective hydration allows parts of the UI
to become interactive sooner. Best practice: identify which parts of a page are critical for first
paint (navigation, header, basic structure) and which can be deferred (e.g. an analytics graph).
Render the critical parts immediately, and wrap the deferred parts in Suspense. Next.js will stream
the HTML and hydrate the critical parts first, giving a faster feeling load. Users on slow networks
benefit as they see content progressively.
```
```
Selective Hydration & Islands: With streaming SSR comes selective hydration , meaning the client
will hydrate interactive components as they arrive or as needed, not block on the entire page. To
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
### •

```
33
```
```
34
35
```
```
36
```
### •

```
37 38
```
```
27
```
```
38
```
### •


```
maximize this benefit, design your page in logical chunks or "islands" of interactivity. For example, a
page might have an interactive comments widget at the bottom; by using Suspense or lazy loading
for that widget, the top of the page can hydrate and become interactive while the comments hydrate
later. Avoid large monolithic client components that wrap the whole page – that would force the
entire page to wait for hydration. Instead, use smaller client components nested within server-
rendered layout. This approach, combined with Next's architecture, allows the browser to prioritize
and hydrate in chunks. In practical terms, ensure each interactive feature is its own component or
group, rather than one giant <App> component, so that React can hydrate them independently.
```
```
useTransition and Non-blocking Updates: React 19's concurrent rendering lets us keep the UI
responsive even during heavy updates. In our design, whenever a state update might be expensive
(filtering a big list, updating a complex canvas, etc.), utilize useTransition. This hook lets us mark
state updates as "non-urgent" so they won't block more urgent updates (like typing or clicks). For
example, wrapping a list re-sort operation in startTransition ensures that if the user is also
interacting with a form, the form stays snappy while the list resort happens in the background. Use
the isPending value from useTransition to give feedback – perhaps a tiny loading indicator
on the affected component – but the key is the UI doesn't freeze. Selective Hydration +
useTransition also means interactive transitions (like route changes or multi-step workflows) can
show intermediate states. Next.js 15's routing can integrate with this: when navigating, we might
start a transition to fetch next page data, and show a pending state (like a top progress bar or
"Loading..." in a button) without blocking the UI thread. This greatly improves UX for complex
operations. As a rule, any state update triggered by user action that isn't trivial (potentially taking
more than ~50ms) should be done inside startTransition. In code, for instance, when a user
applies a filter to a dataset, do:
```
```
const[isPending, startTransition] = useTransition();
constapplyFilter = () => {
startTransition(()=> {
// heavy state update or navigation
setData(filterBigData(...));
});
};
```
Disable controls or show "Loading..." if isPending is true. This way, the user can still scroll or click
elsewhere while the filter applies in the background.

```
Client/Server Boundaries & Network Fetching: Take advantage of Next.js 15 improved data
fetching. Server Components can fetch() data directly (with automatic Request caching and
revalidation), which is often faster and more efficient than doing it on the client. Use Next's Route
Handlers or API routes for any needed server-side actions (like form submissions via the new React
Actions pattern, if available). By doing data mutations on the server (possibly via Next's experimental
useServerAction), you reduce client work and leverage faster server logic. At the same time, use
edge caching and ISR (Incremental Static Regeneration) for content that doesn't change per user –
e.g. public content blocks can be statically generated or cached at the edge, then hydrated if needed.
Next 15 offers improved caching and stable Turbopack for dev, which means we can be confident in
using these without breaking dev flow. Developers should mark components as use client
```
### •

```
26
```
### •

```
39
```

```
only when necessary and prefer passing data from parent Server Components to children rather
than fetching again on the client.
```
```
Lazy Data & Prefetching: Use Next.js smart prefetching – when a component is likely to be needed
soon (like a modal that opens when a button is visible, or a next page link in viewport), Next can
automatically prefetch the code and data. Ensure <Link> components use the default prefetch
behavior for routes, and consider using IntersectionObserver (Next's built-in or React's) to
trigger loading of components just before they scroll into view (for infinite scroll lists, etc.). This way,
by the time the user triggers an action, the resources are already loaded (for instance, preloading a
heavy modal's content in the background). This yields perceived instant responses.
```
```
Monitoring and Fine-Tuning: Lastly, treat performance as part of the design. Use React Developer
Tools and Next's profiling to observe hydration timings and bundle sizes. If a certain component's JS
size is large, consider splitting it further or converting parts to server-side rendering. Next 15's
improved error overlay will warn of hydration mismatches and such; pay attention and adjust to
keep hydration smooth (for example, avoid generating random IDs on server without useId, as
that can cause mismatches – React 19's useId ensures consistent ids across SSR/CSR ). The
design system should include guidelines like "For any list over 100 items, use virtualization" and "Use
Suspense for any fetch expected to take >100ms".
```
By following these patterns, our app will be highly performant: minimal JS payload, quicker first paint via
streaming SSR, no main-thread blocking during interactions, and efficient dark/light theming. In practice,
this means **users get a fast, smooth experience** even as we add rich features and gamified interactions.

## Conclusion

This design system marries aesthetics with performance. The **visual guidelines** (color, typography, layout)
ensure a cohesive look that's playful (pixel/gamified touches) yet professional and content-focused (Notion-
style). The **component patterns and Tailwind utilities** enable rapid UI building with consistent spacing,
styling, and responsive behavior. Every interactive element's states are well-defined for clarity and polished
feel.

Under the hood, the **React 19 + Next.js 15 techniques** – from server components and streaming SSR to
transitions and lazy loading – provide a framework where this UI remains lightning-fast. Developers
can use this document as a blueprint: from setting up theme toggles and customizing shadcn components,
to implementing features in a way that maximizes UX and performance. By adhering to these guidelines,
the team will implement a modern web app that not only looks great in light and dark mode, but also loads
quickly and responds fluidly to user interactions, truly exemplifying a high-performance, well-designed
system.

**Sources:**

```
Tailwind CSS v4.0 Announcement – highlighting built-in CSS variables, container queries, and
performance improvements
Notion Dark Mode Color Palette – example hex values used by Notion for comfortable contrast
```
### •

### •

```
40
```
```
38 27
```
### •

```
41 42
```
-^1


```
shadcn/ui Documentation – theming with CSS variables and default color tokens (light vs dark)
```
```
React 19 Streaming SSR – use hook enabling selective hydration for faster loads
Next.js Lazy Loading Guide – using next/dynamic to defer non-critical scripts
React 19 useTransition Example – non-blocking UI updates with pending states for smooth UX
```
Notion Dark Mode: How To Enable on Desktop and Mobile
https://nicklafferty.com/blog/notion-dark-mode/

Theming - shadcn/ui
https://ui.shadcn.com/docs/theming

Building Blocks for the Web - shadcn/ui
https://ui.shadcn.com/blocks

Calendar - shadcn/ui
https://ui.shadcn.com/docs/components/calendar

Tailwind CSS v4.0 - Tailwind CSS
https://tailwindcss.com/blog/tailwindcss-v

Tailwind v4 - shadcn/ui
https://ui.shadcn.com/docs/tailwind-v

Installation - shadcn/ui
https://ui.shadcn.com/docs/installation

In-depth Analysis of React 19's useTransition Hook - Kelen
https://en.kelen.cc/posts/react-19-usetransition-hook-guide

React 19: What's New and Why It's a Game-Changer | by Abhishek Kedia | Medium
https://abkedia.medium.com/react-19-whats-new-and-why-it-s-a-game-changer-f27cce661caf

Next.js - shadcn/ui
https://ui.shadcn.com/docs/dark-mode/next

Guides: Lazy Loading | Next.js
https://nextjs.org/docs/pages/guides/lazy-loading

Next.js 15
https://nextjs.org/blog/next-

### •^3

```
8
```
-^2738
-^3343
-
    26

```
1
```
```
2 3 4 5 6 7 8 12 22 23
```
```
9 10 16
```
```
11
```
```
13 14 17 18 19 20 21 41 42
```
```
15
```
```
24 25
```
```
26
```
```
27 30 31 32 37 38 40
```
```
28 29
```
```
33 34 35 36 43
```
```
39
```

