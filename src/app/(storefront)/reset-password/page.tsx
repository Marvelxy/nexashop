import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-password-form";

type Search = { token?: string };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { token } = await searchParams;
  if (!token) redirect("/forgot-password");

  return <ResetPasswordForm token={token} />;
}