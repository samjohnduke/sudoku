import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SUPERSudoku" },
    { name: "description", content: "A sudoku app that teaches you solving techniques" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold">SUPERSudoku</h1>
        <p className="text-muted-foreground">
          {loaderData.message || "A sudoku app that teaches you solving techniques"}
        </p>
        <Button size="lg">Play Now</Button>
      </div>
    </div>
  );
}
