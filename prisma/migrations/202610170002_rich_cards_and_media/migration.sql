-- AlterTable
ALTER TABLE "user" ADD COLUMN     "editorMode" TEXT NOT NULL DEFAULT 'simple';

-- AlterTable
ALTER TABLE "Deck" ADD COLUMN     "icon" TEXT NOT NULL DEFAULT 'cards',
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "answerRich" JSONB,
ADD COLUMN     "questionRich" JSONB;

-- CreateTable
CREATE TABLE "ImageUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImageUpload_userId_createdAt_idx" ON "ImageUpload"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ImageUpload" ADD CONSTRAINT "ImageUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
