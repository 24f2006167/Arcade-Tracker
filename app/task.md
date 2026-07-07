# Task List

## Nav Responsive Fix
- [x] Create `components/NavBar.tsx` (client component with hamburger state)
- [x] Update `app/layout.tsx` to use `<NavBar />` instead of inline nav
- [x] Fix `components/AccountSwitcher.tsx` dropdown viewport clipping

## Boot Screen
- [x] Update `components/HackerBootScreen.tsx`
  - [x] Soften copy (BOOT_LINES)
  - [x] Cap timing to 1.5s visible + 0.5s fade
  - [x] Scale matrix density by viewport
  - [x] Add tap-to-skip button

## Global CSS
- [x] Add `overflow-x: hidden` + nav-drawer animation to `globals.css`

## Verification
- [x] `npm run build` — passes, 0 TypeScript errors, 0 compile errors
