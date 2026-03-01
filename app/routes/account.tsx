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
