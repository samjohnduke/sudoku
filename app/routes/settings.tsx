import { eq } from "drizzle-orm";
import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router";
import type { GameSettings } from "~/components/sudoku/types";
import { DEFAULT_SETTINGS } from "~/components/sudoku/types";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { getDb } from "~/db";
import { userSettings } from "~/db/schema";
import { authClient } from "~/lib/auth/auth-client";
import { getSessionUser } from "~/lib/auth/auth.server";
import type { Route } from "./+types/settings";

const SETTINGS_KEY = "super_sudoku_settings";
const THEME_KEY = "super_sudoku_theme";

type Theme = "light" | "dark";

interface SettingsWithTheme extends GameSettings {
  theme?: Theme;
}

function loadLocalSettings(): SettingsWithTheme {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const theme = (localStorage.getItem(THEME_KEY) as Theme) || "light";
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw), theme };
    return { ...DEFAULT_SETTINGS, theme };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveLocalSettings(settings: SettingsWithTheme) {
  if (typeof window === "undefined") return;
  const { theme, ...gameSettings } = settings;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(gameSettings));
  if (theme) localStorage.setItem(THEME_KEY, theme);
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function meta() {
  return [{ title: "Settings — Super Sudoku" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  let serverSettings: GameSettings | null = null;

  const user = await getSessionUser(request, cloudflare.env);
  if (user) {
    try {
      const db = getDb(cloudflare.env.DB);
      const row = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, user.id))
        .get();
      if (row) {
        serverSettings = JSON.parse(row.settings);
      }
    } catch {
      // DB error — use local settings
    }
  }

  return { serverSettings };
}

export default function SettingsPage({ loaderData }: Route.ComponentProps) {
  const { serverSettings } = loaderData;
  const { user } = useOutletContext<{
    user: { id: string; name: string | null } | null;
  }>();

  const [settings, setSettings] = useState<SettingsWithTheme>(() => {
    const local = loadLocalSettings();
    if (serverSettings) {
      return { ...local, ...serverSettings, theme: local.theme };
    }
    return local;
  });

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(settings.theme || "light");
  }, [settings.theme]);

  const [syncError, setSyncError] = useState<string | null>(null);

  const updateSetting = useCallback(
    <K extends keyof SettingsWithTheme>(key: K, value: SettingsWithTheme[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        saveLocalSettings(next);

        // Sync to server if signed in
        if (user) {
          const { theme: _theme, ...gameSettings } = next;
          setSyncError(null);
          fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ settings: gameSettings }),
          }).catch(() => {
            setSyncError("Failed to sync settings to server. Changes saved locally.");
          });
        }

        return next;
      });
    },
    [user]
  );

  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      window.location.href = "/";
    } catch {
      setSigningOut(false);
    }
  }

  const toggleItems: Array<{
    key: keyof GameSettings;
    label: string;
    description: string;
  }> = [
    {
      key: "autoRemoveNotes",
      label: "Auto-remove notes",
      description:
        "Automatically remove pencil marks when placing a number in the same row, column, or box.",
    },
    {
      key: "highlightMatching",
      label: "Highlight matching numbers",
      description:
        "Highlight all cells with the same number as the selected cell.",
    },
    {
      key: "showErrors",
      label: "Show errors",
      description:
        "Highlight incorrect values in red as you enter them.",
    },
    {
      key: "showCandidates",
      label: "Show candidates",
      description:
        "Automatically show all possible candidates in empty cells.",
    },
    {
      key: "hintsEnabled",
      label: "Hints enabled",
      description:
        "Allow the hint system to suggest solving techniques.",
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-5 py-8 pb-20 sm:pb-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize your Super Sudoku experience.
          </p>
        </div>

        {syncError ? (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {syncError}
          </p>
        ) : null}

        {/* Assist Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Assists</CardTitle>
            <CardDescription>
              Toggle gameplay assists on or off.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {toggleItems.map(({ key, label, description }) => (
              <div
                key={key}
                className="flex items-start justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <Label htmlFor={key} className="text-sm font-medium">
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  id={key}
                  checked={!!settings[key]}
                  onCheckedChange={(checked: boolean) =>
                    updateSetting(key, checked)
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Appearance</CardTitle>
            <CardDescription>Choose your preferred theme.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={settings.theme !== "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting("theme", "light")}
              >
                Light
              </Button>
              <Button
                variant={settings.theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting("theme", "dark")}
              >
                Dark
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {user.name || "Sudoku Player"}
                  </p>
                  <p className="text-xs text-muted-foreground">Signed in</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Passkeys</p>
                  <p className="text-xs text-muted-foreground">
                    Add additional passkeys to sign in from other devices.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const result = await authClient.passkey.addPasskey();
                      if (result.error) {
                        alert(result.error.message || "Failed to add passkey.");
                      }
                    }}
                  >
                    Add Passkey
                  </Button>
                </div>

                <div className="pt-2 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    {signingOut ? "Signing out..." : "Sign Out"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in to sync your settings and game progress across all
                  your devices.
                </p>
                <Button asChild size="sm">
                  <Link to="/auth/signin">Sign In</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="pb-4">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
    </div>
  );
}
