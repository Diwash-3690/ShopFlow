# ShopFlow — Master Design System (UI/UX Pro Max)

**Project**: ShopFlow — Hyperlocal Multi-Vendor Retail Marketplace & Merchant POS  
**Design Archetype**: Studio Minimalist + Bento Box Grid + Vibrant & Block-Based  
**Visual Reference**: Aceternity Design & Development Studio  
**Target Viewports**: 360px (mobile small), 390px (mobile standard), 768px (tablet), 1024px+ (desktop)  
**WCAG Standard**: Level AA (Contrast >= 4.5:1 text, >= 3:1 non-text controls, touch targets >= 44x44px)  

---

## 1. Design Principles

1. **High-Trust Local Commerce**: Crisp hairline borders, deliberate whitespace, and calm neutral surfaces make local merchants look credible, modern, and established.
2. **Tabular Precision**: Every currency amount (`₹`), order code, stock count, and timestamp uses `font-mono tabular-nums` to eliminate layout jitter and convey mathematical exactness.
3. **Operational Speed**: No sluggish or layout-shifting animations on merchant cash registers, order pipeline buttons, or inventory cells. Instant state feedback (80–150ms).
4. **Vector-Only Iconography**: Zero emoji used as structural controls or action icons. All icons are standardized Lucide SVG vector glyphs with consistent 1.75px stroke weights and proper accessibility labels.
5. **Mobile-First Touch Ergonomics**: Minimum 44x44px touch targets on mobile for all quantity steppers, category chips, navigation pills, and checkout buttons.

---

## 2. Color Palette & Semantic Tokens

### Canvas & Surface Hierarchy
```css
--color-bg-canvas:        #FAFAFA; /* Warm neutral application background */
--color-surface-card:     #FFFFFF; /* Elevated crisp card surface */
--color-surface-subtle:   #F4F4F6; /* Table headers, muted background panels */
--color-surface-overlay:  rgba(15, 23, 42, 0.6); /* Backdrop scrim for dialogs */
```

### Borders & Dividers
```css
--color-border-subtle:    #E2E8F0; /* Hairline card & input borders (1px) */
--color-border-hover:     #CBD5E1; /* Card hover state divider */
--color-border-strong:    #94A3B8; /* Active / focus borders */
```

### Typography & Readability (WCAG AA >= 4.5:1)
```css
--color-text-primary:     #0F172A; /* Slate 900 — Maximum readability for headlines & values */
--color-text-secondary:   #475569; /* Slate 600 — High-contrast secondary text (> 4.8:1) */
--color-text-muted:       #64748B; /* Slate 500 — Captions, timestamps, units */
--color-text-inverse:     #FFFFFF; /* White on primary dark buttons */
```

### Brand & Role Accents
```css
--color-brand-primary:    #2563EB; /* Blue 600 — Primary action, focus rings */
--color-brand-hover:      #1D4ED8; /* Blue 700 — Active / hover states */
--color-brand-subtle:     #EFF6FF; /* Blue 50 — Subtle chip & badge background */
--color-brand-border:     #BFDBFE; /* Blue 200 — Chip border */

--color-role-customer:    #059669; /* Emerald 600 — Customer brand accent */
--color-role-vendor:      #2563EB; /* Blue 600 — Vendor brand accent */
--color-role-admin:       #4F46E5; /* Indigo 600 — Admin security accent */
```

### Semantic Status Tokens
```css
--color-status-success-bg:   #F0FDF4; /* Emerald 50 */
--color-status-success-text: #166534; /* Emerald 800 */
--color-status-success-border:#BBF7D0; /* Emerald 200 */

--color-status-warning-bg:   #FFFBEB; /* Amber 50 */
--color-status-warning-text: #92400E; /* Amber 800 */
--color-status-warning-border:#FDE68A; /* Amber 200 */

--color-status-error-bg:     #FEF2F2; /* Rose 50 */
--color-status-error-text:   #991B1B; /* Rose 800 */
--color-status-error-border: #FECACA; /* Rose 200 */
```

---

## 3. Typography Scale & Font Pairing

- **Primary Font Family**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Tabular / Monospace Family**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

| Token | Size | Line Height | Tracking | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `text-display` | 2.5rem (40px) | 1.1 | `-0.025em` | Black (900) | Main hero headlines |
| `text-h1` | 2.0rem (32px) | 1.2 | `-0.02em` | Bold (800) | Dashboard & section headings |
| `text-h2` | 1.5rem (24px) | 1.25 | `-0.015em` | Bold (700) | Card titles, modal headers |
| `text-h3` | 1.125rem (18px)| 1.3 | `-0.01em` | SemiBold (600) | Subsections, item names |
| `text-body` | 0.875rem (14px)| 1.5 | `normal` | Regular (400/500) | Standard body, labels |
| `text-caption` | 0.75rem (12px) | 1.4 | `+0.01em` | Medium (500) | Helper text, secondary stats |
| `text-micro` | 0.6875rem (11px)| 1.3 | `+0.02em` | SemiBold (600) | Status pills, unit tags |
| `tabular-nums` | Inherit | Inherit | `tight` | 600/700/800 | Currency (₹), Quantities, Codes |

---

## 4. Spacing, Radii & Depth Scale

### Disciplined Radius Hierarchy (No arbitrary mixing)
```css
--radius-sm:  0.375rem; /* 6px — Micro badges, inline tags */
--radius-md:  0.5rem;   /* 8px — Standard buttons, inputs, pills */
--radius-lg:  0.75rem;  /* 12px — Category chips, dropdown menus, cards */
--radius-xl:  1.0rem;   /* 16px — Feature panels, modal containers */
--radius-full:9999px;   /* Circular badges, avatar discs */
```

### Elevation & Borders (Hairlines over heavy shadows)
- **Subtle Hairline**: `border border-slate-200/90` + `shadow-xs` (`0 1px 2px 0 rgba(0, 0, 0, 0.05)`)
- **Card Hover State**: `border-slate-300` + `shadow-sm` (`0 2px 4px 0 rgba(0, 0, 0, 0.06)`) + `scale-[1.005]`
- **Modal Elevation**: `border border-slate-200` + `shadow-xl` (`0 20px 25px -5px rgba(0, 0, 0, 0.1)`)
- **Focus Ring**: `ring-2 ring-blue-500 ring-offset-2 ring-offset-white`

---

## 5. UI Component Standards

### A. Button Hierarchy
1. **Primary Button**: Solid Deep Blue (`bg-blue-600 hover:bg-blue-700 text-white`), min-height 40px (desktop) / 44px (mobile), `active:scale-[0.98]`.
2. **Secondary / Outline**: Clean White (`bg-white hover:bg-slate-50 border border-slate-200 text-slate-800`).
3. **Success / Order Button**: Deep Emerald (`bg-emerald-600 hover:bg-emerald-700 text-white`) for Cart & Order placement.
4. **Destructive**: Rose Subtle (`bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200`).

### B. Status Badges & Indicators
- Live status indicators feature a 6px solid dot with optional pulse animation.
- Verified / Ready: Emerald pill with solid green dot.
- Pending Payment / Review: Amber pill with solid warning dot.
- Out of Stock / Cancelled: Rose pill with muted red dot.

### C. Quantity Stepper
- Steppers feature min 40x40px (mobile 44x44px) tap areas with tactile click feedback, preventing missed taps during rapid ordering or inventory adjustments.

---

## 6. Pre-Delivery Checklist
- [x] Zero emoji as system/action icons (all replaced with vector SVGs).
- [x] All touch targets >= 44x44px on mobile viewports.
- [x] Text contrast >= 4.5:1 against light surfaces.
- [x] Tabular numbers on all prices (`₹`), quantities, and pickup codes.
- [x] Visible focus rings on all interactive elements.
- [x] No horizontal page scroll on 360px mobile viewports.
- [x] Reverse geocoding auto-fills editable physical address.
- [x] Category filtering works with single-category pills, dropdown, and "All".
