import { redirect } from "next/navigation";

// /typing → màn thiết lập (ADR-020: tách route setup/play). Giữ link cũ sống.
export default function TypingIndexPage() {
  redirect("/typing/setup");
}
