# Contributing to NexaShop

## Dev setup
1. Fork + clone
2. `cp .env.example .env`
3. `npm install`
4. `npm run db:push && npm run db:seed`
5. `npm run dev`

## Rules
- All DB writes go in `src/actions/` with Zod validation + `requireUser/requireSeller/requireAdmin` + `revalidatePath`
- No secrets in PRs. Use `.env.example` for new vars.
- `npm run lint` must pass. Prisma schema changes need migration + seed update.
- Pages: Server Components by default. `"use client"` only for cart drawer, forms with optimistic UI.

## Branching
`feat/`, `fix/`, `docs/` + conventional commits. One feature per PR with screenshot/demo.

## Good first issues
- Add pagination to search
- Product image carousel
- Apply coupon code at checkout
- Seller analytics chart
