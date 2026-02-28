import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Find all entries with shareMode=community
  const entries = await prisma.journalEntry.findMany({
    where: { shareMode: "community" },
    select: { id: true, title: true, notebookId: true },
  });

  console.log(`Found ${entries.length} community entries:`);

  for (const entry of entries) {
    const post = await prisma.communityPost.findUnique({
      where: { entryId: entry.id },
    });
    if (!post) {
      console.log(
        `  ❌ "${entry.title}" (${entry.id}) — NO CommunityPost! Creating one...`,
      );
      await prisma.communityPost.create({
        data: {
          entryId: entry.id,
          isAnonymous: true,
          notebookId: entry.notebookId ?? undefined,
        },
      });
      console.log(`  ✅ Created CommunityPost for "${entry.title}"`);
    } else {
      console.log(
        `  ✅ "${entry.title}" (${entry.id}) — CommunityPost exists: ${post.id}`,
      );
    }
  }

  const total = await prisma.communityPost.count();
  console.log(`\nTotal CommunityPosts now: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
