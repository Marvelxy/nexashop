import { auth, signOut } from "@/lib/auth";

export async function AuthNav() {
  const session = await auth();

  if (session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit" className="text-sm">
          Sign out
        </button>
      </form>
    );
  }

  return (
    <a href="/login" className="text-sm">
      Sign in
    </a>
  );
}
