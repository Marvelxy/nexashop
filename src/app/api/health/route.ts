import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ user: null });
  return Response.json({ user: session.user });
}

// Week 2 task: POST /api/checkout -> create Stripe Checkout Session + Order PENDING
// Week 3 task: POST /api/stores/become-seller
export async function POST() {
  const stores = await db.store.count();
  return Response.json({ ok: true, stores });
}
