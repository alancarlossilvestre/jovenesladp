---
name: premium-frontend-ui
description: 'A comprehensive guide for GitHub Copilot to craft immersive, high-performance web experiences with advanced motion, typography, and architectural craftsmanship.'
---

# Immersive Frontend UI Craftsmanship

As an AI engineering assistant, your role when building premium frontend experiences goes beyond outputting functional HTML and CSS. You must architect **immersive digital environments**. This skill provides the blueprint for generating highly intentional, award-level web applications that prioritize aesthetic quality, deep interactivity, and flawless performance.

When a user requests a high-end landing page, an interactive portfolio, or a specialized component that requires top-tier visual polish, apply the following rigorous standards to every line of code you generate.

---

## 1. Establishing the Creative Foundation

Before generating layout code, ensure you understand the core emotional resonance the UI should deliver. Do not default to generic, unopinionated code.

Commit to a strong visual identity in your CSS and component structure:
- **Editorial Brutalism**: High-contrast monochromatic palettes, oversized typography, sharp rectangular edges, and raw grid structures.
- **Organic Fluidity**: Soft gradients, deeply rounded corners, selective glassmorphism overlays, and bouncy spring-based physics.
- **Cyber / Technical**: Dark mode dominance, glowing neon accents, monospaced typography, and rapid, staggered reveal animations.
- **Cinematic Pacing**: Full-viewport imagery, slow cross-fades, profound use of negative space, and scroll-dependent storytelling.

---

## 2. Structural Requirements for Immersive UI

When scaffolding a page or generating core components, include the following architectural layers to transform a standard page into an experience.

### 2.1 The Entry Sequence (Preloading & Initialization)
A blank screen is unacceptable. The user's first interaction must set expectations.
- **Implementation**: Generate a lightweight preloader component that handles asset resolution (fonts, initial images, 3D models).
- **Animation**: Output code that transitions the preloader away fluidly—such as a split-door reveal, a scale-up zoom, or a staggered text sweep.

### 2.2 The Hero Architecture
The top fold must command attention immediately.
- **Visuals**: Output code that implements full-bleed containers (`100vh`/`100dvh`).
- **Typography Engine**: Ensure headlines are broken down syntactically (e.g., span wrapping by word or character) to allow for cascading entrance animations.
- **Depth**: Utilize subtle floating elements or background clipping paths to create a sense of scale and depth behind the primary copy.

### 2.3 Fluid & Contextual Navigation
- **Implementation**: Do not generate standard static navbars. Output sticky headers that react toscroll direction (hide on scroll down, reveal on scroll up).
- **Interactivity**: Include hover states that reveal rich content (e.g., mega-menus that display image previews of the hovered link).

### 2.4 Layout Rhythm & Surface Discipline
- **Shared Rhythm**: In existing products, centralize external section spacing in shared tokens or utilities. Prefer consistent margin-based section rhythm over ad hoc `padding-top` tweaks on each wrapper.
- **Padding Discipline**: Use component padding for internal breathing room, not as the primary mechanism for page-to-page separation.
- **Readable Small Labels**: Eyebrow pills, chips, and compact badges on light or neutral surfaces need dedicated foreground, border, and fill tokens. Do not assume a faint accent colour remains readable once the surrounding surface changes.
- **Shared Icon Systems**: When a content family repeats across multiple surfaces, define icon and status mappings in shared helpers or data. Reuse them across bundles, catalogues, and explainer sections so the page feels system-led rather than improvised.
- **Card Header Architecture**: If a card needs an icon, heading, and a status chip like "Launching soon", group icon and text together and reserve a dedicated top slot or row for the badge. On narrow screens, intentionally stack the badge instead of letting it collide with the heading.
- **Opening and Ending Transitions**: Audit the first section after a hero and the last section before the footer. Shared top-margin rhythm systems often need local overrides for hero overlap, CTA breathing room, and footer-divider separation.
- **Framework Awareness**: Before replacing layout primitives or removing a CSS framework, audit which containers, grids, forms, and navigation behaviours still depend on it. Replace them systematically instead of layering custom CSS on top and assuming the framework is optional.
- **Cross-Surface QA**: When polishing one card grid, audit sibling grids for missing icons, badge drift, equal-height mismatches, and top-alignment inconsistencies across desktop and mobile.

---

## 3. The Motion Design System

Animation is not an afterthought; it is the connective tissue of a premium site. Always implement the following motion principles:

### 3.1 Scroll-Driven Narratives
Generate code utilizing modern scroll libraries (like GSAP's ScrollTrigger) to tie animations to user progress.
- **Pinned Containers**: Create sections that lock into the viewport while secondary content flows past or reveals itself.
- **Horizontal Journeys**: Translate vertical scroll data into horizontal movement for specific galleries or showcases.
- **Parallax Mapping**: Assign subtle, varying scroll-speeds to background elements, midground text, and foreground imagery.

### 3.2 High-Fidelity Micro-Interactions
The cursor is the user's avatar. Build interactions around it.
- **Magnetic Components**: Write logic that calculates the distance between the mouse pointer and a button, pulling the button towards the cursor dynamically.
- **Custom Tracking Elements**: Generate custom cursor components that follow the mouse with calculated interpolation (lerp) for a smooth drag effect.
- **Dimensional Hover States**: Use CSS Transforms (`scale`, `rotateX`, `translate3d`) to give interactive elements weight and tactile feedback.

---

## 4. Typography & Visual Texture

The aesthetics of your generated code must reflect premium craftsmanship.

- **Type Hierarchy**: Enforce massive contrast in scale. Headlines should utilize extreme sizing (`clamp()` functions spanning up to `12vw`), while body copy remains incredibly crisp (`16px-18px` minimum).
- **Font Selection**: Always recommend or implement highly specified variable fonts or premium typefaces over system defaults.
- **Atmospheric Filters**: Implement CSS/SVG noise overlays (`mix-blend-mode: overlay`, opacity `0.02 - 0.05`) to remove digital sterility and add photographic grain.
- **Lighting & Glass**: Use `backdrop-filter: blur(x)` and semi-transparent borders sparingly for overlays, floating controls, and accent panels. Avoid defaulting long-form reading surfaces or dense content cards to translucent treatments unless the design system clearly supports it.

---

## 5. The Performance Imperative

A beautiful site that stutters is a failure. Enforce strict performance guardrails in all generated code:

- **Hardware Acceleration**: Only animate properties that do not trigger layout recalculations: `transform` and `opacity`. Code that animates `width`, `height`, `top`, or `margin` should be fiercely avoided.
- **Render Optimization**: Apply `will-change: transform` intelligently on complex moving elements, but remove it post-animation to conserve memory.
- **Responsive Degradation**: Wrap custom cursor logic and heavy hover animations in `@media (hover: hover) and (pointer: fine)` to ensure pristine performance on touch devices.
- **Accessibility**: Wrap heavy continuous animations in `@media (prefers-reduced-motion: no-preference)`. Never sacrifice user accessibility for aesthetic flair.

### 5.1 Render Verification Discipline
- **Serial Browser Checks**: When using Playwright or another browser automation tool to inspect multiple pages, navigate serially or open separate tabs. Parallel navigations and screenshots against one page context produce unreliable visual checks.
- **Rendered Review Required**: Use Playwright to inspect the live interface before and after meaningful UI changes. Do not sign off based on code inspection alone.
- **Screenshot Cleanup**: Delete temporary Playwright screenshots once you have extracted the necessary findings, unless the user explicitly asks to keep them.
- **UI Closure Pass**: Explicitly inspect badge readability, hero-to-first-section spacing, footer divider breathing room, and last-section-to-footer separation before treating a visual task as complete.
- **Comparable Surface Audit**: On card-heavy pages, compare equivalent sections for consistent icon treatment, badge placement, equal heights, and responsive header wrapping before closing the task.

---

## 6. Implementation Ecosystem

When the user asks you to implement these patterns, leverage industry-standard libraries tailored to their framework:

### For React / Next.js Targets
- Structure the application to support **Framer Motion** for layout transitions and spring physics.
- Recommend **Lenis** (`@studio-freight/lenis`) for smooth scrolling context.
- Implement **React Three Fiber** (`@react-three/fiber`) if webGL or 3D interactions are requested.

### For Vanilla / HTML / Astro Targets
- Rely heavily on **GSAP** (GreenSock Animation Platform) for timeline sequencing.
- Utilize vanilla **Lenis** via CDN for scroll hijacking and smoothing.
- Use **SplitType** for safe, accessible typography chunking.

---

## Summary of Action

Whenever you receive a prompt to "Build a premium landing page," "Create an Awwwards-style component," or "Design an immersive UI," you must automatically:
1. Wrap the output in a robust, scroll-smoothed architecture.
2. Provide CSS that guarantees perfect performance using composited layers.
3. Integrate sweeping, staggered component entrances.
4. Elevate the typography using fluid scales.
5. Create an intentional, memorable aesthetic footprint.
