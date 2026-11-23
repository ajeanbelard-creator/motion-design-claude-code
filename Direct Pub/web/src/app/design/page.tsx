import type { Metadata } from "next";
import { Showcase } from "./showcase";

export const metadata: Metadata = { title: "Système de design · Direct Pub" };

export default function DesignPage() {
  return <Showcase />;
}
