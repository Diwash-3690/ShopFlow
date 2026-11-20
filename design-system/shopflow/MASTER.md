# ShopFlow Design System — MASTER

**Version**: 1.0.0  
**Stack**: React 19 + Vite 8 + Tailwind CSS v4  
**Design Archetype**: Studio Minimalist + Bento Box Grid + Vibrant & Block-Based  
**Domain Focus**: Hyperlocal Retail Marketplace & Merchant POS  

---

## 1. Design Tokens

### CSS Variables (`index.css`)
```css
:root {
  --color-bg-canvas: #FAFAFA;
  --color-surface-card: #FFFFFF;
  --color-surface-subtle: #F4F4F6;
  --color-border-subtle: #E2E8F0;
  --color-border-hover: #CBD5E1;
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-muted: #64748B;
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-status-success: #16A34A;
  --color-status-warning: #D97706;
  --color-status-error: #DC2626;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}
```

### Typography Scale
- Body: 14px / Line-height 1.5 / Slate 600 / Inter
- Numbers & Currency: `font-mono tabular-nums` / Slate 900
- Headings: Tracking `-0.02em` / Inter Bold

### Accessibility Targets
- Minimum touch target: 44px
- Minimum normal text contrast: 4.5:1
- Active press scale: `active:scale-[0.98]`
- Vector icons only (Lucide-React), no emoji as structural UI controls
