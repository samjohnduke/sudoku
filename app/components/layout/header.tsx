import { Link, useLocation } from "react-router";
import { cn } from "~/lib/utils";

interface HeaderProps {
  user: { id: string; name: string | null } | null;
}

export function Header({ user }: HeaderProps) {
  const location = useLocation();

  const links = [
    { to: "/", label: "Play" },
    { to: "/bible", label: "Bible" },
    { to: "/stats", label: "Stats" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-primary">
          SUPERSudoku
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                location.pathname === link.to
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <span className="text-sm text-muted-foreground">
              {user.name || "Player"}
            </span>
          ) : (
            <Link
              to="/auth/signin"
              className="text-sm text-primary hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur-sm z-50">
        <div className="flex justify-around py-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex flex-col items-center text-xs py-1 px-2",
                location.pathname === link.to
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
