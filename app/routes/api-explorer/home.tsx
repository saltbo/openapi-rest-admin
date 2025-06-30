import type { Route } from "./+types/home";
import Home from "~/pages/api-explorer/Home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "资源管理 - OpenAPI Admin" },
    { name: "description", content: "OpenAPI 资源数据管理前台" },
  ];
}

export default function HomeRoute() {
  return <Home />;
}
