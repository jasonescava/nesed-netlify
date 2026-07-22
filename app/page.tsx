import type { Metadata } from "next";
import CarMarketplace from "./CarMarketplace";

export const metadata: Metadata = {
  title: "NESED — Find the right car, not more tabs",
  description: "Compare live purchase and lease offers from trusted automotive marketplaces in one beautifully simple search.",
};

export default function Home() { return <CarMarketplace />; }
