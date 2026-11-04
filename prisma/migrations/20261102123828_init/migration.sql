-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "outputUrl" TEXT,
    "outputFormat" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "sourceLang" TEXT NOT NULL,
    "targetLang" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranslationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "ConversionHistory" ADD CONSTRAINT "ConversionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationHistory" ADD CONSTRAINT "TranslationHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
