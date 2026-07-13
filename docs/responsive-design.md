# Responsive Design

The project uses global CSS in `app/globals.css` plus component-specific class names. Public pages, admin pages, the form builder, Email Center, and Q&A have responsive rules for desktop, tablet, and mobile widths.

## Active Breakpoints

Common breakpoints in the stylesheet include:

```text
900px
760px / 767px
700px / 680px
640px
480px
```

Use nearby existing breakpoints instead of introducing many new one-off breakpoints.

## Public Layout Expectations

- Navigation should collapse cleanly on small screens.
- Public cards/lists should move from multi-column grids to single-column layouts.
- Q&A search/category controls should stack without clipped labels.
- Dynamic forms should render stacked on narrow screens even when using two-column desktop layout.
- Buttons should wrap or stretch instead of overflowing their container.
- Page-builder dynamic blocks should remain readable when embedded in mobile pages.

## Admin Layout Expectations

- The admin sidebar and content area must fit below tablet widths.
- Tables should use wrapping, compact columns, or scrollable containers where needed.
- Form actions should stack on narrow screens.
- Builder sidebars, Email Center forms, role authority grids, and user-management forms should not overlap the main content.
- Touch targets should remain large enough for mobile/tablet admin use.

## Forms and Q&A

The form builder and public dynamic forms use:

```text
.form-grid
.form-grid__wide
.form-builder-layout
.dynamic-form
.dynamic-form__fields
```

Q&A pages use:

```text
.qa-page
.qa-hero
.qa-search
.qa-layout
.qa-list
.qa-card
.qa-ask-panel
```

When changing these areas, test at desktop width, about 900px, about 640px, and about 390px.

## Accessibility Checks

Before shipping responsive UI changes:

- Keyboard focus must remain visible.
- Labels must remain associated with inputs.
- Icon-only controls need accessible labels or titles.
- No text should overlap another element.
- No critical action should be hidden only by viewport width.
- Reduced-motion media query behavior should be preserved for animated UI.
