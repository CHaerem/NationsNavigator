# Implementing Apple's "Liquid Glass" Design

This document outlines a plan to adopt the new "Liquid Glass" design language introduced by Apple across iOS 26, iPadOS 26, macOS Tahoe, watchOS 26 and tvOS 26.

## What is Liquid Glass?
- Introduced at WWDC 2025 as Apple's broadest software redesign.
- It combines the optical qualities of glass with dynamic fluidity to emphasize content.
- "This translucent material reflects and refracts its surroundings, while dynamically transforming to help bring greater focus to content" – [Apple Newsroom](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/).

## Key Visual Traits
- Highly translucent surfaces with soft color tints.
- Dynamic reflections and refractions that react to underlying content.
- Smooth, fluid animations between interface states.
- Rounded, pill‑shaped buttons and containers.
- Blur effects to create depth and separation of foreground and background elements.

## Implementation Plan for NationsNavigator
1. **Create a Liquid Glass theme CSS**
   - Use `backdrop-filter: blur(30px)` and subtle gradients on containers.
   - Apply semi‑transparent backgrounds using rgba colors, e.g. `background: rgba(255,255,255,0.3)`.
   - Add inset and drop shadows for a sense of depth.
2. **Update key components**
   - Search bar, info panel and modals should adopt the translucent style.
   - Buttons become softer with more rounded corners and dynamic hover states.
3. **Introduce motion effects**
   - Use CSS transitions for panel openings and button interactions.
   - Consider subtle parallax or light reflection animations on hover.
4. **Refine the color palette**
   - Bright accent colors drawn from existing variables but with higher saturation.
   - Keep backgrounds mostly neutral to let the glass effect shine.
5. **Progressive enhancement**
   - Provide a fallback for browsers without `backdrop-filter` support.
   - Detect user preference for reduced transparency and offer a solid background alternative.

## Sample CSS Snippet
```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(30px) saturate(150%);
  border-radius: var(--radius-lg);
}
```

Apply this class to panels or headers to start experimenting with the look.

## Next Steps
- Prototype the style on a small portion of the UI and gather feedback.
- Expand to all components once the design direction is validated.
- Keep performance in mind when applying heavy blur effects on large areas.
