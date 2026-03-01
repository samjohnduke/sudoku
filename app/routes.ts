import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("play/:puzzleId", "routes/play.$puzzleId.tsx"),
  route("api/puzzle/random", "routes/api.puzzle.random.ts"),
  route("api/auth/*", "routes/api.auth.$.ts"),
  route("api/game/save", "routes/api.game.save.ts"),
  route("bible", "routes/bible.tsx"),
  route("bible/:technique", "routes/bible.$technique.tsx"),
  route("auth/signin", "routes/auth.signin.tsx"),
  route("api/sync/migrate", "routes/api.sync.migrate.ts"),
  route("settings", "routes/settings.tsx"),
  route("api/settings", "routes/api.settings.ts"),
  route("stats", "routes/stats.tsx"),
  route("account", "routes/account.tsx"),
] satisfies RouteConfig;
