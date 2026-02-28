/**
 * One-time sync script: backfill CommunityPost rows for any JournalEntry
 * that has shareMode="community" but no CommunityPost record.
 *
 * Run from the backend directory:
 *   node scripts/sync-community-posts.js
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find all entries marked as community that have NO CommunityPost row
  const orphans = await prisma.journalEntry.findMany({
    where: {
      shareMode: "community",
      communityPost: null, // no matching CommunityPost row
    },
    select: { id: true, isAnonymous: true, notebookId: true },
  });

  if (orphans.length === 0) {
    console.log("✅ All community entries already have a CommunityPost row.");
    return;
  }

  console.log(`Found ${orphans.length} orphan entries. Backfilling...`);

  for (const entry of orphans) {
    await prisma.communityPost.upsert({
      where: { entryId: entry.id },
      update: {},
      create: {
        entryId: entry.id,
        isAnonymous: entry.isAnonymous ?? false,
        notebookId: entry.notebookId ?? undefined,
      },
    });
    console.log(`  ✓ Created CommunityPost for entry ${entry.id}`);
  }

  console.log("✅ Sync complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
