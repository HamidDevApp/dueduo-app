import { redirect } from "next/navigation";

// Temporary: the marketing landing page replaces this in a later step.
export default function Home() {
  redirect("/dashboard");
}
