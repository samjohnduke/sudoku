import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("play/:puzzleId", "routes/play.$puzzleId.tsx"),
  route("api/puzzle/random", "routes/api.puzzle.random.ts"),
  route("api/auth/*", "routes/api.auth.$.ts"),
  route("api/game/save", "routes/api.game.save.ts"),
  route("bible", "routes/bible.tsx"),
] satisfies RouteConfig;
