import type { Metadata } from "next";

import { TransformationStudio } from "@/app/ui/transformation-studio";

export const metadata: Metadata = {
  title: "Friday | Content Conversion Studio",
  description:
    "A polished conversion workspace for rendering HTML visually, viewing markdown as docs, and handling everyday payload, table, and URL transforms in one place.",
};

export default function HomePage() {
  return <TransformationStudio />;
}
