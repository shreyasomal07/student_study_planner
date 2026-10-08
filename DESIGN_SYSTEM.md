# Student Academic Planner — Design System & Style Guide

Welcome to the **Student Academic Planner** design system. This guide defines our core tokens, typography, surfaces, and reusable component patterns based on our calibrated color palette. All future components, features, and views must strictly adhere to these design tokens to maintain a cohesive, editorial, wellness-workspace aesthetic.

---

## 🎨 1. Color Palette Tokens

Our color system uses exactly **7 carefully calibrated tokens**. No other colors should be introduced.

| Token Name | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| **`--liminal-night`** | `#2C2F40` | **Main Secondary**: Headings, primary buttons, active nav pill states, hero gradient dark side, AI Copilot button, and dark surfaces. Most dominant color after backgrounds. |
| **`--inner-resolve`** | `#556574` | Links, icons, info accents, body text on light surfaces. |
| **`--calm-awakening`** | `#92A5A8` | Hero gradient mid-tone, arch panel, soft hover states, chips, `done`/`low` priority status. |
| **`--vital-spark`** | `#E06F32` | **Accent (use sparingly)**: "DUE SOON" badges, active navbar dot or pill accent, hero tagline, Copilot accent, key CTAs, `due soon`/`high` priority status. |
| **`--rooted-strength`** | `#C0A381` | Borders, dividers, secondary accents, book spines, `medium` priority status. |
| **`--steady-renewal`** | `#ECE0C9` | Cards, panels, inputs, secondary surfaces, modal bodies. |
| **`--wild-light`** | `#FFFAEF` | Page background, crisp text on dark surfaces, hero text. |

### CSS Variables Reference
```css
:root {
  --liminal-night: #2C2F40;
  --inner-resolve: #556574;
  --calm-awakening: #92A5A8;
  --vital-spark: #E06F32;
  --rooted-strength: #C0A381;
  --steady-renewal: #ECE0C9;
  --wild-light: #FFFAEF;
}
```

### Tailwind Theme Utilities
- **Backgrounds**: `bg-liminal-night`, `bg-inner-resolve`, `bg-calm-awakening`, `bg-vital-spark`, `bg-rooted-strength`, `bg-steady-renewal`, `bg-wild-light`
- **Text**: `text-liminal-night`, `text-inner-resolve`, `text-calm-awakening`, `text-vital-spark`, `text-rooted-strength`, `text-steady-renewal`, `text-wild-light`
- **Borders**: `border-liminal-night`, `border-inner-resolve`, `border-calm-awakening`, `border-vital-spark`, `border-rooted-strength`, `border-steady-renewal`, `border-wild-light`

---

## 🚦 Status & Priority Mapping

- **High Priority / Due Soon**: `bg-vital-spark text-liminal-night font-bold border border-vital-spark` or `bg-vital-spark/20 text-vital-spark border-vital-spark/50`
- **Medium Priority**: `bg-rooted-strength/30 text-liminal-night font-semibold border border-rooted-strength/60`
- **Low Priority / Done / Completed**: `bg-calm-awakening/25 text-inner-resolve font-semibold border border-calm-awakening/40`
- **Informational**: `bg-inner-resolve/15 text-liminal-night font-semibold border border-inner-resolve/30`

---

## 🔤 2. Typography

- **Editorial Headings**: `font-serif` (`Playfair Display`, serif)
  - Used for hero headlines, major section headers, modal titles, and motivational highlights.
- **Body & UI Elements**: `font-sans` (`Plus Jakarta Sans`, `Montserrat`, sans-serif)
  - Used for buttons, body paragraphs, tab labels, counters, metadata, and form inputs.
  - Characterized by small, airy, letter-spaced subheadings (`text-xs uppercase tracking-wider font-semibold`).

---

## 📐 3. Geometry, Radii & Depth

### Border Radii
- **Hero Banner**: `rounded-b-[44px]` or `rounded-b-[56px]`
- **Standard Cards & Modals**: `rounded-2xl` or `rounded-[24px]` (20–24px)
- **Buttons, Badges & Chips**: `rounded-full` (capsule / pill shapes)
- **Inputs & Selects**: `rounded-2xl` or `rounded-xl`

### Shadows & Elevation
- **Soft Studio Card**: `shadow-[0_8px_30px_rgba(44,47,64,0.05)]`
- **Floating Bar**: `shadow-[0_12px_36px_rgba(44,47,64,0.08)]`
- **Lift on Hover**: `transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(44,47,64,0.09)]`
- **Border Treatment**: Use subtle borders (`border border-rooted-strength/30` or `border border-rooted-strength/40`) rather than harsh solid outlines.

---

## 🧩 4. Core Component Patterns

### A. Buttons
1. **Primary Button**:
   ```jsx
   <button className="px-5 py-2.5 bg-liminal-night text-wild-light font-medium rounded-full shadow-sm hover:bg-liminal-night/90 active:scale-95 transition-all">
     Action
   </button>
   ```
2. **Secondary Button**:
   ```jsx
   <button className="px-5 py-2.5 bg-steady-renewal text-liminal-night border border-rooted-strength/40 font-medium rounded-full hover:bg-rooted-strength/20 active:scale-95 transition-all">
     Cancel
   </button>
   ```
3. **Accent / Highlight Button**:
   ```jsx
   <button className="px-5 py-2.5 bg-vital-spark text-liminal-night font-bold rounded-full hover:bg-vital-spark/90 active:scale-95 transition-all shadow-xs">
     Highlight Action
   </button>
   ```

### B. Cards & Panels
```jsx
<div className="bg-steady-renewal/80 backdrop-blur-sm border border-rooted-strength/40 rounded-3xl p-6 shadow-[0_8px_30px_rgba(44,47,64,0.04)] transition-all duration-300 hover:shadow-[0_14px_35px_rgba(44,47,64,0.08)]">
  <div className="text-xs uppercase tracking-wider font-semibold text-inner-resolve mb-2">Category</div>
  <h3 className="font-serif text-xl text-liminal-night font-bold">Card Title</h3>
  <p className="text-sm text-inner-resolve mt-1">Content goes here...</p>
</div>
```

### C. Unified Shared Top Bar (`SharedTopBar`)
- **Single Component Architecture**: One universal top bar used identically across every page (Dashboard, Timetable, Tasks, Classes, Exams, Focus Mode) to eliminate layout jumps.
- **Left Element**: Tag chip with Sparkle icon (`#ai study planner · focus mode on`).
- **Center Element**: Capsule container (`bg-steady-renewal/90 backdrop-blur-md border border-rooted-strength/50 rounded-full shadow-md p-1 sm:p-1.5`).
  - Active pill: `bg-liminal-night text-wild-light shadow-xs rounded-full px-3 sm:px-4 py-1.5 sm:py-2 font-bold` (or in hero: `bg-vital-spark text-liminal-night shadow-md font-bold`).
  - Inactive items: `text-inner-resolve hover:text-liminal-night hover:bg-rooted-strength/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 font-semibold`.
  - **No dots between items**: Spacing handled via clean flex gap (`gap-1 sm:gap-1.5`).
- **Right Elements**: Date chip (`Calendar`), Edit Profile button (`Pencil`), and Logout button (`LogOut`).
- **Hero State**: When placed over the hero gradient, uses `bg-wild-light/15 border-wild-light/25 text-wild-light` with glassmorphic backdrop.

---

## 🛡️ 5. Rules for Future Development
1. **Never hardcode hex codes or arbitrary colors** outside the 7 tokens.
2. **Always ensure WCAG AA accessible contrast** (use `--liminal-night` text on `--vital-spark` or `--steady-renewal`).
3. **Use capsule/pill shapes (`rounded-full`)** for all action buttons, chips, and navigational tabs.
4. **Hero Specifications (Dashboard)**:
   - Full screen `min-h-[100dvh]` with edge-to-edge geometry (`rounded-none`).
   - Title set in **`Playfair Display` (`font-display`)**.
   - Gradient flow: From `--liminal-night` on the left through `--inner-resolve` and `--calm-awakening` on the right.
5. **Top Bar Consistency**: Always use the shared `SharedTopBar` component across all views without page-specific header variations.
