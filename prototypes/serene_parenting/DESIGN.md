---
name: Serene Parenting
colors:
  surface: '#f7fafc'
  surface-dim: '#d7dadd'
  surface-bright: '#f7fafc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f6'
  surface-container: '#ebeef0'
  surface-container-high: '#e5e9eb'
  surface-container-highest: '#e0e3e5'
  on-surface: '#181c1e'
  on-surface-variant: '#434841'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eef1f3'
  outline: '#737970'
  outline-variant: '#c3c8bf'
  surface-tint: '#4a6549'
  primary: '#4a6549'
  on-primary: '#ffffff'
  primary-container: '#8ba888'
  on-primary-container: '#243d24'
  inverse-primary: '#b0cfad'
  secondary: '#446277'
  on-secondary: '#ffffff'
  secondary-container: '#c4e4fd'
  on-secondary-container: '#48667c'
  tertiary: '#7e553d'
  on-tertiary: '#ffffff'
  tertiary-container: '#c8957a'
  on-tertiary-container: '#512e19'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ccebc7'
  primary-fixed-dim: '#b0cfad'
  on-primary-fixed: '#07200b'
  on-primary-fixed-variant: '#334d33'
  secondary-fixed: '#c8e6ff'
  secondary-fixed-dim: '#abcae3'
  on-secondary-fixed: '#001e2e'
  on-secondary-fixed-variant: '#2b4a5e'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#f2bb9d'
  on-tertiary-fixed: '#301403'
  on-tertiary-fixed-variant: '#643e28'
  background: '#f7fafc'
  on-background: '#181c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  thumb-zone-bottom: 80px
---

## Brand & Style

The brand personality is a "digital embrace"—empathetic, reliable, and profoundly calm. Designed specifically for exhausted parents, the UI avoids high-intensity stimuli, opting instead for a soft-focus aesthetic that reduces cognitive load. 

This design system utilizes a **Modern Minimalist** style infused with **Soft Tonal Layering**. It prioritizes heavy whitespace and a "breathable" layout to prevent the user from feeling overwhelmed. Visual elements are designed to feel tactile but gentle, using soft shadows and organic curves to create a sense of safety and ease. The interface should feel like a quiet room in a busy house.

## Colors

The palette is anchored in nature-inspired pastels to evoke tranquility.
- **Sage Green (Primary):** Used for growth, feeding, and "active" positive states.
- **Muted Blue (Secondary):** Reserved for sleep, rest, and night-time tracking.
- **Warm Peach (Tertiary):** Used for care tasks, hygiene, and milestones.
- **Neutral:** A warm charcoal for text to maintain high legibility without the harshness of pure black.

**Dark Mode:** The dark theme transitions to a deep "Midnight Navy" charcoal (#1A1C1E) rather than pitch black. Pastels are slightly desaturated and deepened to maintain their soothing quality while preventing eye strain during late-night feedings.

## Typography

This design system uses **Plus Jakarta Sans** for its friendly, rounded terminals and exceptional legibility. The typeface strikes a balance between modern efficiency and approachable warmth.

Typography scales are generous; body text is slightly larger than standard (16px–18px) to accommodate tired eyes. Line heights are kept airy to improve tracking. Sentence case is preferred for all headers to maintain a conversational and non-intimidating tone.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a focus on "One-Handed Utility." Interactive elements, including primary navigation and action buttons, are concentrated in the bottom 60% of the screen (the "Thumb Zone").

A base unit of 8px guides all spatial relationships. Side margins are kept wide (24px) to frame content and provide clear touch-safe zones. Vertical rhythm uses generous stacking (32px) between major sections to prevent visual clutter, ensuring each piece of information is consumed in isolation.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layers** rather than heavy borders.
- **Level 0 (Floor):** Background color.
- **Level 1 (Cards):** Surface color with a very soft, diffused shadow (Blur: 20px, Y: 4, Opacity: 4%) tinted with the primary or secondary color to keep the "soft" feel.
- **Level 2 (Modals/Active):** Higher elevation with a slightly tighter but darker shadow for focus.

Glassmorphism is used sparingly for the bottom navigation bar, employing a heavy backdrop blur (20px) and a subtle 1px white border at 10% opacity to ensure the interface feels lightweight and modern.

## Shapes

The shape language is defined by significant **Roundedness (0.5rem to 1.5rem)**. Sharp corners are entirely avoided as they represent tension. 

Buttons and Chips use a **Pill-shaped** (fully rounded) geometry to emphasize "tappability" and friendliness. Cards use a 1.5rem (`rounded-xl`) corner radius to create a container that feels soft and non-threatening. Iconography should follow this rule, utilizing rounded caps and joins.

## Components

- **Activity Cards:** Large-format cards (minimum height 120px) that use color-coded vertical bars on the left edge. They feature a large title and a secondary "time ago" label.
- **Action Buttons:** Oversized, pill-shaped buttons with a minimum tap target of 56px. Primary buttons use a subtle gradient of the primary color; secondary buttons use a tonal background (sage at 10% opacity) with dark text.
- **Selection Chips:** Used for quick-tagging mood or symptoms. They toggle from a light-gray background to a saturated pastel version of the category color when active.
- **Bottom Navigation:** A persistent, frosted-glass bar with large icons. The "Quick Log" button is a floating action button (FAB) centered or offset for easy thumb access, using the warm peach tertiary color.
- **Input Fields:** Soft-filled backgrounds with no borders. Focus states are indicated by a 2px sage-green glow. Labels always remain visible (no floating labels) to reduce cognitive effort.
- **Progress Ring:** Used for tracking sleep or feeding duration, featuring thick, rounded stroke ends and soft color fills.