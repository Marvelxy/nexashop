import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user) redirect("/");
  return <ForgotPasswordForm />;
}