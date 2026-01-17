import type { RouteConfig } from "@react-router/dev/routes";

export default [
  {
    path: "/",
    file: "routes/home.tsx",
  },
  {
    path: "/palette/:id",
    file: "routes/palette.$id.tsx",
  },
  {
    path: "/explore",
    file: "routes/explore.tsx",
  },
] satisfies RouteConfig;
