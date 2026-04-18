import { PrismaClient } from '@prisma/client';

/**
 * Generates a unique 8-digit member ID.
 * Ensures no collisions by checking against existing users in PostgreSQL.
 */
export const generateUniqueMemberId = async (prisma: PrismaClient): Promise<number> => {
  let memberId: number;
  let isUnique = false;

  while (!isUnique) {
    // Generate a random number between 10000000 and 99999999
    memberId = Math.floor(10000000 + Math.random() * 90000000);

    const existingUser = await prisma.user.findUnique({
      where: { memberId },
    });

    if (!existingUser) {
      isUnique = true;
    }
  }

  return memberId!;
};
