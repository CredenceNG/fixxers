import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getCurrentUser } from "@/lib/auth";

const f = createUploadthing();

// Auth function to verify user is logged in
const auth = async () => {
  const user = await getCurrentUser();
  if (!user) throw new UploadThingError("Unauthorized");
  return { userId: user.id };
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Review photo uploader
  reviewImageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 5,
    },
  })
    .middleware(async () => {
      // Authenticate user
      const user = await auth();
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on the server after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Return metadata to the client
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Badge document uploader
  badgeDocumentUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      // Authenticate user and verify fixer role
      const user = await auth();
      
      // Additional check: must be a fixer
      const fullUser = await getCurrentUser();
      if (!fullUser?.roles.includes('FIXER')) {
        throw new UploadThingError("Only fixers can upload badge documents");
      }
      
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Badge document uploaded by userId:", metadata.userId);
      console.log("File URL:", file.url);

      return { 
        uploadedBy: metadata.userId, 
        url: file.url,
        name: file.name,
        size: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
