/*
  Warnings:

  - Added the required column `week` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Exercise` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "week" INTEGER NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;
