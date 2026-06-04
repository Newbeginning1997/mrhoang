import { redirect } from "next/navigation";
import { getCurrentUser, roleHome } from "@/lib/auth";

export default async function HomePage() {
  const context = await getCurrentUser();

  if (!context) {
    redirect("/login");
  }

  redirect(roleHome(context.profile.role, context.student?.id));
}
