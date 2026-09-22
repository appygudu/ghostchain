import { createFileRoute } from "@tanstack/react-router";
import { Ghostchain } from "@/components/game/Ghostchain";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Ghostchain />;
}
