import { createUploadthing, type FileRouter } from "uploadthing/next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"

const f = createUploadthing()

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions)

      if (!session) {
        throw new Error("Unauthorized")
      }

      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
