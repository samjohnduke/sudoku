# User Menu Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a user menu — dropdown on desktop, full-page account route on mobile — replacing inline user name text and consolidating Stats/Settings into the user menu.

**Architecture:** Desktop header gets a CircleUser icon that opens a Radix DropdownMenu with navigation items and sign out. Mobile bottom bar replaces Stats and Settings tabs with a single Account tab linking to a new `/account` route. The account page is a simple list of links.

**Tech Stack:** React Router v7, Radix UI DropdownMenu, Lucide icons, Tailwind CSS, better-auth client

---

### Task 1: Add DropdownMenu UI Component

**Files:**
- Create: `app/components/ui/dropdown-menu.tsx`

**Step 1: Create the shadcn/ui DropdownMenu component**

Follow the same pattern as `app/components/ui/dialog.tsx` — thin wrappers around Radix primitives with `data-slot` attributes and `cn()` for class merging. Import from `radix-ui` (not `@radix-ui/react-dropdown-menu`).

```tsx
"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "~/lib/utils"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
}
```

**Step 2: Verify it compiles**

Run: `npx react-router typegen && npx tsc -b --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/components/ui/dropdown-menu.tsx
git commit -m "feat: add DropdownMenu UI component"
```

---

### Task 2: Update Header — Desktop Dropdown

**Files:**
- Modify: `app/components/layout/header.tsx`

**Step 1: Update imports**

Replace the existing imports and add new ones:

```tsx
import { BarChart2, BookOpen, CircleUser, LogOut, Settings } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { Logo } from "~/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { authClient } from "~/lib/auth/auth-client";
import { cn } from "~/lib/utils";
```

**Step 2: Add desktop nav items constant (without Stats/Settings)**

Keep the existing `NAV_ITEMS` for desktop nav links but remove Stats and Settings since they move into the dropdown:

```tsx
const DESKTOP_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Play", useLogo: true },
  { to: "/bible", label: "Learn", icon: BookOpen },
];
```

**Step 3: Add mobile nav items constant**

```tsx
const MOBILE_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Play", useLogo: true },
  { to: "/bible", label: "Learn", icon: BookOpen },
  { to: "/account", label: "Account", icon: CircleUser },
];
```

**Step 4: Replace the desktop right-side section**

Replace the `<div className="flex items-center gap-2">` block with a DropdownMenu:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger className="rounded-full p-1.5 text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <CircleUser className="size-5" />
    <span className="sr-only">Account menu</span>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-48">
    {user ? (
      <>
        <DropdownMenuLabel>{user.name || "Player"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/stats"><BarChart2 className="size-4" /> Stats</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings"><Settings className="size-4" /> Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOut className="size-4" /> Sign Out
        </DropdownMenuItem>
      </>
    ) : (
      <>
        <DropdownMenuItem asChild>
          <Link to="/auth/signin">Sign In</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings"><Settings className="size-4" /> Settings</Link>
        </DropdownMenuItem>
      </>
    )}
  </DropdownMenuContent>
</DropdownMenu>
```

**Step 5: Add sign out handler and useNavigate**

Inside the `Header` component function body, add:

```tsx
const navigate = useNavigate();

async function handleSignOut() {
  await authClient.signOut();
  navigate("/");
}
```

**Step 6: Update desktop nav to use DESKTOP_NAV_ITEMS**

Change the desktop nav's `{NAV_ITEMS.map(...)}` to `{DESKTOP_NAV_ITEMS.map(...)}`.

**Step 7: Update mobile nav to use MOBILE_NAV_ITEMS**

Change the mobile nav's `{NAV_ITEMS.map(...)}` to `{MOBILE_NAV_ITEMS.map(...)}`.

**Step 8: Remove unused NAV_ITEMS**

Delete the old `NAV_ITEMS` constant.

**Step 9: Verify it compiles**

Run: `npx react-router typegen && npx tsc -b --noEmit`
Expected: No errors

**Step 10: Commit**

```bash
git add app/components/layout/header.tsx
git commit -m "feat: add desktop dropdown menu and update mobile nav tabs"
```

---

### Task 3: Add Account Route

**Files:**
- Create: `app/routes/account.tsx`
- Modify: `app/routes.ts`

**Step 1: Add account route to routes.ts**

Add this line to the routes array:

```tsx
route("account", "routes/account.tsx"),
```

**Step 2: Create the account page**

```tsx
import { BarChart2, ChevronRight, LogOut, Settings } from "lucide-react";
import { Link, useNavigate, useOutletContext } from "react-router";
import { authClient } from "~/lib/auth/auth-client";

export function meta() {
  return [{ title: "Account — Super Sudoku" }];
}

export default function AccountPage() {
  const { user } = useOutletContext<{
    user: { id: string; name: string | null } | null;
  }>();
  const navigate = useNavigate();

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen justify-center pb-20 sm:pb-0">
      <div className="w-full max-w-lg px-6 py-8 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight font-serif">Account</h1>

        {user ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">{user.name || "Sudoku Player"}</p>
            <p className="text-xs text-muted-foreground">Signed in</p>
          </div>
        ) : null}

        <nav className="divide-y divide-border rounded-lg border">
          {!user ? (
            <Link
              to="/auth/signin"
              className="flex items-center justify-between px-4 py-3 text-sm hover:bg-accent transition-colors"
            >
              Sign In
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ) : null}
          <Link
            to="/stats"
            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-accent transition-colors"
          >
            <span className="flex items-center gap-3">
              <BarChart2 className="size-4 text-muted-foreground" />
              Stats
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            to="/settings"
            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-accent transition-colors"
          >
            <span className="flex items-center gap-3">
              <Settings className="size-4 text-muted-foreground" />
              Settings
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          {user ? (
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          ) : null}
        </nav>
      </div>
    </div>
  );
}
```

**Step 3: Verify it compiles**

Run: `npx react-router typegen && npx tsc -b --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add app/routes/account.tsx app/routes.ts
git commit -m "feat: add account page route for mobile user menu"
```

---

### Task 4: Manual Testing

**Step 1: Start dev server**

Run: `npx react-router dev`

**Step 2: Test desktop**

- Resize browser to > 640px width
- Verify CircleUser icon appears in the header right side
- Click it — dropdown should appear with Stats, Settings, Sign Out (or Sign In + Settings if not authenticated)
- Click Stats/Settings — should navigate to the correct pages
- Verify the desktop nav bar no longer shows Stats/Settings text links

**Step 3: Test mobile**

- Resize browser to < 640px width or use device emulation
- Verify bottom bar shows: Play, Learn, Account (3 tabs)
- Tap Account — should navigate to `/account` page
- Verify account page shows list with Stats, Settings, Sign Out (or Sign In + Settings)
- Tap each link — should navigate correctly

**Step 4: Test auth states**

- Sign out, verify desktop dropdown shows "Sign In" + "Settings"
- Sign out, verify mobile account page shows "Sign In" + "Settings"
- Sign in, verify desktop dropdown shows user name + all items
- Sign in, verify mobile account page shows user name + all items

**Step 5: Commit design doc**

```bash
git add docs/plans/2026-03-01-user-menu-design.md
git commit -m "docs: add user menu design plan"
```
