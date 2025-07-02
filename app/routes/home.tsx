import Home from "~/pages/Home";
import type { Route } from "../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home - OpenAPI Admin" },
    { name: "description", content: "OpenAPI Admin Home" },
  ];
}

export default function HomeRoute() {
  return <Home />;
}
