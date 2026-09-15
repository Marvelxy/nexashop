import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, authProviders, signIn } from "@/lib/auth";
import { LoginForm } from "./login-form";

type Search = { callbackUrl?: string };

function roleAllows(role: string, next: string) {
  if (next.startsWith("/admin")) return role === "ADMIN";
  if (next.startsWith("/seller")) return role === "SELLER" || role === "ADMIN";
  return true;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  const raw = callbackUrl || "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  const providers = authProviders();

  let accessNeeded: React.ReactNode | null = null;
  if (session?.user) {
    if (roleAllows(session.user.role, next)) redirect(next);
    accessNeeded =
      next.startsWith("/admin") ? (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          This account doesn&apos;t have admin access. Sign in with an admin account
          or ask the site owner to grant it.
        </p>
      ) : (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          This account doesn&apos;t have seller access yet.{" "}
          <Link href="/become-seller" className="underline">
            Become a seller
          </Link>{" "}
          to create a store and start selling.
        </p>
      );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Sign in</h1>

      {accessNeeded}

      {providers.credentials && <LoginForm next={next} />}

      <div className="text-sm space-y-1 text-center">
        <Link href="/forgot-password" className="text-neutral-600 underline">
          Forgot password?
        </Link>
      </div>

      {providers.google && (
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: next });
          }}
        >
          <button type="submit" className="w-full rounded border py-2">
            Continue with Google
          </button>
        </form>
      )}

      {providers.github && (
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: next });
          }}
        >
          <button type="submit" className="w-full rounded border py-2">
            Continue with GitHub
          </button>
        </form>
      )}

      {!providers.google && (
        <p className="text-sm text-neutral-500">
          Google sign-in is off because <code>AUTH_GOOGLE_ID</code> /{" "}
          <code>AUTH_GOOGLE_SECRET</code> are empty. Create a Web OAuth client in{" "}
          <a
            className="underline"
            href="https://console.cloud.google.com/apis/credentials"
          >
            Google Cloud Console
          </a>
          , add redirect URI{" "}
          <code>http://localhost:3000/api/auth/callback/google</code>, then restart
          the dev server.
        </p>
      )}

      <p className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="underline">
          Create one
        </Link>
      </p>
    </div>
  );
}