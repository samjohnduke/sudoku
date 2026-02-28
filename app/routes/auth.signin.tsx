import { useState } from "react";
import { useNavigate } from "react-router";
import { authClient } from "~/lib/auth/auth-client";
import { migrateLocalDataToServer } from "~/lib/sync";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";

export function meta() {
  return [{ title: "Sign In — SUPERSudoku" }];
}

export default function SignIn() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await authClient.signIn.passkey();
      await migrateLocalDataToServer();
      navigate("/");
    } catch {
      setError("Passkey sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setLoading(true);
    setError(null);
    try {
      // Better Auth requires an email for sign-up, then we attach a passkey.
      // We generate a placeholder email since passkeys are the real auth method.
      await authClient.signUp.email({
        email: `user-${Date.now()}@supersudoku.local`,
        password: crypto.randomUUID(),
        name: "Sudoku Player",
      });
      await authClient.passkey.addPasskey();
      await migrateLocalDataToServer();
      navigate("/");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in to SUPERSudoku</CardTitle>
          <CardDescription>
            Sync your puzzles and stats across all your devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSignIn}
            disabled={loading}
          >
            Sign in with Passkey
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            className="w-full"
            variant="outline"
            size="lg"
            onClick={handleRegister}
            disabled={loading}
          >
            Create Account
          </Button>

          {error ? (
            <p className="text-sm text-destructive text-center">{error}</p>
          ) : null}

          <p className="text-xs text-muted-foreground text-center">
            Accounts are optional. You can always play without signing in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
