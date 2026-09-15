# NexaShop

Open-source multi-vendor e-commerce built with Next.js 15 App Router.

Buyers browse/search/buy. Sellers manage products/orders. Admins approve stores.

## Features

- Storefront: ISR homepage, SEO product pages, search/filter/sort
- Cart + Stripe Checkout + webhooks + stock decrement
- Auth.js (GitHub/Google) + RBAC BUYER/SELLER/ADMIN
- Seller dashboard: products, orders, publish toggle
- Admin: approve stores
- Reviews (verified buyers only), coupons, order emails
- UploadThing images, Resend emails, sitemap + OG

## Quickstart

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000

Demo accounts (seed): `seller@nexashop.dev` / `admin@nexashop.dev` with `AUTH_DEV_PASSWORD` (see `.env.example`). Google/GitHub need OAuth client IDs.

## Tech

Next.js 15, React 19, Prisma + SQLite, Auth.js v5, Stripe, UploadThing, Resend, Tailwind + shadcn/ui, Zod Server Actions

## Project structure

- `src/app/(storefront)` - public shop
- `src/app/(dashboard)` - seller/admin
- `src/actions` - all DB writes (Server Actions + Zod + RBAC)
- `src/app/api/webhooks/stripe` - payment fulfillment
- `prisma/schema.prisma` - User/Store/Product/Order/Review/Coupon

## Contributing

See CONTRIBUTING.md. Good first issues: pagination, product image gallery, coupon apply at checkout.

## License

MIT
