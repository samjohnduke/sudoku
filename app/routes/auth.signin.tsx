import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth/auth-client";
import { migrateLocalDataToServer } from "~/lib/sync";

export function meta() {
  return [{ title: "Sign In — Super Sudoku" }];
}

export default function SignIn() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"choice" | "register">("choice");

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    const result = await authClient.signIn.passkey();
    if (result.error) {
      setError(result.error.message || "Passkey sign-in failed. Please try again.");
      setLoading(false);
      return;
    }
    await migrateLocalDataToServer();
    navigate("/");
  }

  async function handleRegister() {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    const signUpResult = await authClient.signUp.email({
      email: email.trim(),
      password: crypto.randomUUID(),
      name: "Sudoku Player",
    });

    if (signUpResult.error) {
      setError(signUpResult.error.message || "Registration failed. Please try again.");
      setLoading(false);
      return;
    }

    const passkeyResult = await authClient.passkey.addPasskey();
    if (passkeyResult.error) {
      // Account was created but passkey failed — still signed in, just no passkey yet
      console.warn("Passkey registration failed:", passkeyResult.error.message);
    }

    await migrateLocalDataToServer();
    navigate("/");
  }

  return (
    <div className="flex items-center justify-center min-h-dvh px-5 pb-20 sm:pb-0">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-serif italic text-3xl text-foreground">
            {mode === "register" ? "Create account" : "Sign in"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sync your puzzles and stats across devices.
          </p>
        </div>

        {mode === "choice" ? (
          <div className="space-y-4">
            <Button
              className="w-full rounded-xl"
              size="lg"
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in with Passkey"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              className="w-full rounded-xl"
              variant="outline"
              size="lg"
              onClick={() => { setMode("register"); setError(null); }}
              disabled={loading}
            >
              Create Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                onKeyDown={(e) => { if (e.key === "Enter") handleRegister(); }}
              />
            </div>

            <Button
              className="w-full rounded-xl"
              size="lg"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Continue"}
            </Button>

            <button
              onClick={() => { setMode("choice"); setError(null); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Back
            </button>
          </div>
        )}

        {error ? (
          <p className="text-sm text-destructive text-center">{error}</p>
        ) : null}

        <p className="text-xs text-muted-foreground text-center">
          Accounts are optional. You can always play without signing in.
        </p>
      </div>
    </div>
  );
}
