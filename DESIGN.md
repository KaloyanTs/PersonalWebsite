# Design System Document: High-End Editorial Portfolio

## 1. Overview & Creative North Star
**Creative North Star: The Digital Curator**
This design system moves away from the rigid, "bootstrap" grid of standard portfolios and moves toward a sophisticated, editorial experience. It treats the portfolio not as a list of links, but as a high-end digital gallery. By blending the organic elegance of a sophisticated serif with the clinical precision of a modern sans-serif, we create a "Digital Curator" persona: authoritative, creative, and intentional.

To break the "template" look, designers must embrace **intentional asymmetry**. Layouts should feel like a premium print magazine, utilizing generous whitespace (negative space) as a structural element rather than a void to be filled.

---

## 2. Colors
The palette is rooted in a deep, nocturnal foundation with high-contrast accents of soft pink and editorial white.

### Surface Hierarchy & Nesting
Depth is achieved through tonal shifts rather than lines.
*   **Base Layer:** `surface` (`#131313`) is the canvas for the entire experience.
*   **Layering Tiers:** Use `surface-container-low` (`#1b1b1b`) for subtle sectioning and `surface-container-high` (`#2a2a2a`) for interactive elements like cards.
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for defining sections. Boundaries must be defined solely through background color shifts or the spacing scale.

### The Glass & Gradient Rule
To provide "visual soul," use semi-transparent glass effects for floating navigation or overlays.
*   **Glassmorphism:** Use `surface` at 60% opacity with a `backdrop-filter: blur(20px)`.
*   **Signature Textures:** For primary CTAs, use a linear gradient transitioning from `primary` (`#ffafd7`) to `primary_container` (`#ff79c6`) at a 135-degree angle. This adds a "high-fidelity" depth that flat pink cannot achieve.

---

## 3. Typography
The system uses a "Dual-Voice" typographic approach to balance professional authority with creative personality.

*   **The Editorial Voice (Serif - Newsreader):** Used for `display` and `headline` scales. This font carries the "personal" and "sophisticated" weight of the brand.
*   **The Functional Voice (Sans-Serif - Manrope):** Used for `title`, `body`, and `label` scales. This provides the "modern" and "professional" clarity required for data and navigation.

**Key Scales:**
*   **Display-LG:** `newsreader`, 3.5rem. Use for hero statements.
*   **Headline-MD:** `newsreader`, 1.75rem. Use for section headers.
*   **Body-LG:** `manrope`, 1rem. Use for primary storytelling and descriptions.
*   **Label-MD:** `manrope`, 0.75rem (All Caps / Letter Spacing: 0.05em). Use for small metadata and eyebrow text.

---

## 4. Elevation & Depth
We define hierarchy through **Tonal Layering** rather than traditional structural shadows.

*   **The Layering Principle:** Stack `surface-container-lowest` elements on top of `surface-container-low` sections to create a soft, natural lift.
*   **Ambient Shadows:** If an element must float (like a modal or a primary button), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4)`. The shadow should feel like ambient light occlusion, not a "drop shadow."
*   **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use a "Ghost Border": `outline-variant` (`#54424a`) at 15% opacity. Never use 100% opaque borders.

---

## 5. Components

### Buttons
*   **Primary:** A pill-shaped (`full` roundedness) button using the Signature Gradient (Primary to Primary-Container). Text should be `on-primary-fixed` (`#3c0029`) for maximum legibility.
*   **Secondary:** Ghost style. Transparent background with a `primary` Ghost Border. 
*   **Tertiary:** Text-only in `primary` with an underline that appears on hover using a 2px offset.

### Cards & Projects
*   **Construction:** Forbid the use of divider lines. Instead of a box, use a `surface-container-high` background with `xl` (0.75rem) roundedness.
*   **Content:** Project titles should be `title-lg` (Manrope) while the category/date uses `label-md` in `primary` color.
*   **Interaction:** On hover, the card should transition to `surface-bright` (`#393939`) and shift -4px on the Y-axis.

### Input Fields
*   **Styling:** Use `surface-container-highest` (`#353535`) as the field background. 
*   **States:** On focus, the bottom border (the only border allowed) should animate from `outline-variant` to `primary`. Use `label-sm` for floating labels.

### Chips (Skill Tags)
*   **Visual:** Small, `md` roundedness, using `secondary-container` (`#454747`) with `on-secondary-container` (`#b4b5b5`) text. This keeps them subtle and secondary to the project titles.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins. If a text block is 6 columns wide, offset it by 2 columns rather than centering it.
*   **Do** use `16` (5.5rem) or `20` (7rem) spacing between major sections to give the "Editorial" feel room to breathe.
*   **Do** utilize `primary-fixed-dim` for secondary text that needs a "tint" of the brand color without being distracting.

### Don't
*   **Don't** use 100% white (`#ffffff`) for body text; it is too harsh against the black background. Use `on-surface` (`#e2e2e2`) for a softer, premium reading experience.
*   **Don't** use standard "Divider" lines. If you need to separate content, use a background color shift or a vertical space of at least `8` (2.75rem).
*   **Don't** use high-saturation pink for large background areas. Keep `primary` restricted to accents, CTAs, and highlights.