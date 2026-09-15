import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const uploadRouter = {
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } }).onUploadComplete(
    async () => {}
  ),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
