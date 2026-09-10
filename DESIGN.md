---
name: Bitewise
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#41493e'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#71796d'
  outline-variant: '#c1c9ba'
  surface-tint: '#306b2b'
  primary: '#306b2b'
  on-primary: '#ffffff'
  primary-container: '#99d98c'
  on-primary-container: '#266022'
  inverse-primary: '#97d68a'
  secondary: '#00696c'
  on-secondary: '#ffffff'
  secondary-container: '#8ff3f6'
  on-secondary-container: '#007073'
  tertiary: '#006782'
  on-tertiary: '#ffffff'
  tertiary-container: '#77d5fb'
  on-tertiary-container: '#005c75'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b2f3a3'
  primary-fixed-dim: '#97d68a'
  on-primary-fixed: '#002201'
  on-primary-fixed-variant: '#165215'
  secondary-fixed: '#8ff3f6'
  secondary-fixed-dim: '#72d6da'
  on-secondary-fixed: '#002021'
  on-secondary-fixed-variant: '#004f52'
  tertiary-fixed: '#bbe9ff'
  tertiary-fixed-dim: '#74d2f8'
  on-tertiary-fixed: '#001f29'
  on-tertiary-fixed-variant: '#004d63'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  meadow-light: '#D9ED92'
  meadow-mid-light: '#B5E48C'
  meadow-primary: '#99D98C'
  meadow-deep: '#76C893'
  teal-soft: '#52B69A'
  teal-primary: '#34A0A4'
  blue-vibrant: '#168AAD'
  blue-ocean: '#1A759F'
  blue-deep: '#1E6091'
  blue-midnight: '#184E77'
  surface-bg: '#F8FAF7'
  text-main: '#1A2E22'
  text-muted: '#526E5D'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-3xs: 2px
  space-2xs: 4px
  space-xs: 8px
  space-sm: 12px
  space-md: 16px
  space-lg: 24px
  space-xl: 32px
  space-2xl: 48px
  gutter: 16px
  margin-screen: 20px
---

## Brand & Style

This design system employs a **Modern Minimalist** movement paired with a friendly, organic personality tailored for a health and nutrition tracking application. The UI evokes feelings of calm, vitality, balance, and approachability. High-contrast readability ensures accessibility for users logging meals on the go, while soft, rounded spatial arrangements create an inviting, low-stress environment for daily habit-building.

## Colors

The palette is derived directly from the Meadow Green reference set, harmonizing fresh lime-greens (`#99D98C`, `#B5E48C`) with deep aquatic teals (`#34A0A4`, `#168AAD`) and oceanic blues. 

- **Primary:** `#99D98C` serves as the signature brand fill and primary interactive surface tint.
- **Secondary:** `#34A0A4` provides rich contrast for data visualization, progress arcs, and active states.
- **Tertiary:** `#168AAD` and `#1A759F` anchor deep-tier elements and secondary accents.
- **Neutral:** Clean whites and paper-like surfaces (`#F8FAF7`) paired with high-contrast dark forest text (`#1A2E22`) ensure optimal legibility and WCAG AAA compliance.

## Typography

The type system uses **Plus Jakarta Sans**, offering a friendly, rounded geometric structure that remains exceptionally legible at small sizes. 

- **Hierarchy:** Strict proportional scaling from 32px display headers down to 10px micro-labels.
- **Weights:** Restricted to Regular (`400`) for body copy and SemiBold (`600`) / Bold (`700`) for headers and interactive labels to maintain a clean, uncluttered visual rhythm.

## Layout & Spacing

The layout relies on a **fluid grid model** optimized for mobile viewports, adhering to a strict 4px/8px baseline grid system.

- **Margins:** Consistent 20px horizontal screen margins frame the content safely across various mobile device dimensions.
- **Gutters:** 16px spatial separation between stacked meal cards and dashboard widgets.
- **Adaptability:** On larger viewports (tablet and desktop), content constrains to a centered 480px max-width container, preserving the intimate, card-driven mobile experience.

## Elevation & Depth

Visual hierarchy is established primarily through **tonal surface layering** and subtle, low-opacity ambient shadows rather than stark borders. 

- **Surfaces:** Cards utilize distinct background tiers (light greens, teals, and soft whites) to segregate content categories (e.g., summary metrics vs. meal logs).
- **Shadows:** A soft, diffused shadow (`0px 8px 24px rgba(26, 46, 34, 0.06)`) is applied to primary interactive cards to lift them gently off the background without appearing heavy or aggressive.

## Shapes

A friendly, rounded shape language (`roundedness: 2`) defines all interactive containers, buttons, and data cards.

- **Border Radius:** Standard cards and containers use generous rounding (`1rem` / 16px to `1.5rem` / 24px). Buttons and pill badges use full circular rounding (pill-shaped) to reinforce approachability and tactile feedback.

## Components

### Buttons
- **Primary:** Full-width or pill-shaped buttons featuring solid primary or teal backgrounds with high-contrast text. Height should be a minimum of 48px for touch accessibility.
- **Icon Buttons:** Circular containers (40x40px) featuring primary or neutral background tints with dark glyphs (e.g., date pagination arrows).

### Cards
- **Meal & Summary Cards:** Large rounded containers (`1.5rem` radius) with soft pastel fills (`#99D98C`, `#52B69A`, `#34A0A4`). Feature clear typographic grouping (meal title, total calories, logged items) and an inline circular add-action button on the trailing edge.

### Input Fields & Controls
- **Text Inputs:** Clean, rounded input boxes with subtle borders, generous inner padding, and clear 16px body text to prevent auto-zooming on mobile devices.
- **Progress Bars:** Thin, rounded track containers with solid fill indicators for tracking individual macronutrients (Protein, Carbs, Fat) beneath primary metrics.
