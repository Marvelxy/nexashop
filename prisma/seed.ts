import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const demoPassword = hashSync(process.env.AUTH_DEV_PASSWORD ?? "dev", 12);

async function main() {
  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { name: "Electronics", slug: "electronics" },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: "fashion" },
    update: {},
    create: { name: "Fashion", slug: "fashion" },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@nexashop.dev" },
    update: { role: "SELLER", password: demoPassword },
    create: {
      email: "seller@nexashop.dev",
      name: "Demo Seller",
      role: "SELLER",
      password: demoPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@nexashop.dev" },
    update: { role: "ADMIN", password: demoPassword },
    create: {
      email: "admin@nexashop.dev",
      name: "Demo Admin",
      role: "ADMIN",
      password: demoPassword,
    },
  });

  const store = await prisma.store.upsert({
    where: { slug: "demo-store" },
    update: {},
    create: {
      name: "Demo Store",
      slug: "demo-store",
      description: "Seeded demo store for local dev",
      ownerId: seller.id,
      isApproved: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: "nexashop-starter-headphones" },
    update: {},
    create: {
      storeId: store.id,
      name: "Starter Headphones",
      slug: "nexashop-starter-headphones",
      description: "Seeded demo product. Replace with real catalog.",
      price: 7999,
      stock: 25,
      images: [],
      categoryId: electronics.id,
      isPublished: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: "nexashop-starter-tee" },
    update: {},
    create: {
      storeId: store.id,
      name: "Starter Tee",
      slug: "nexashop-starter-tee",
      description: "Seeded demo product. Replace with real catalog.",
      price: 2999,
      stock: 100,
      images: [],
      categoryId: fashion.id,
      isPublished: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      percentOff: 10,
      isActive: true,
    },
  });

  console.log(
    "Seed done: 2 categories, seller@nexashop.dev, admin@nexashop.dev, 1 store, 2 products, 1 coupon",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());