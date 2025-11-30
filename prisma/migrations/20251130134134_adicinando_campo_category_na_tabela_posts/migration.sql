/*
  Warnings:

  - Added the required column `category` to the `posts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('General', 'Events', 'Finances', 'Sports');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "category" "Category" NOT NULL;
