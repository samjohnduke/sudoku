import { Link, useLocation } from "react-router";
import { cn } from "~/lib/utils";
import { Grid3X3, BookOpen, BarChart2, Settings } from "lucide-react";

interface HeaderProps {
  user: { id: string; name: string | null } | null;
}

const NAV_ITEMS = [
  { to: "/", label: "Play", icon: Grid3X3 },
  { to: "/bible", label: "Learn", icon: BookOpen },
  { to: "/stats", label: "Stats", icon: BarChart2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Header({ user }: HeaderProps) {
  const location = useLocation();

  // Hide header entirely on play pages
  const isPlayPage = location.pathname.startsWith("/play/");
  if (isPlayPage) return null;

  return (
    <>
      {/* Desktop header */}
      <header className="hidden sm:block border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl text-foreground tracking-wide">
            SUPERSudoku
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  location.pathname === item.to ||
                    (item.to === "/bible" && location.pathname.startsWith("/bible"))
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
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
      </header>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/95 backdrop-blur-md z-50">
        <div className="flex justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to === "/bible" && location.pathname.startsWith("/bible"));

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 min-w-[64px] transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
