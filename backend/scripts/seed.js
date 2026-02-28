/**
 * seed.js — Dearly Journal Demo Data Seeder (with media)
 * Run:  node scripts/seed.js
 * ⚠️   Wipes ALL data first, then seeds rich demo content.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────
const ago = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};
const wrapHtml = (paragraphs) => paragraphs.map((p) => `<p>${p}</p>`).join("");

// ─── Public media assets ─────────────────────────────────────────────────────
// Avatars  — DiceBear lorelei style (SVG, no auth needed)
const avatars = {
  piyush:
    "https://api.dicebear.com/8.x/lorelei/svg?seed=Piyush&backgroundColor=b6e3f4",
  aarav:
    "https://api.dicebear.com/8.x/lorelei/svg?seed=Aarav&backgroundColor=c0aede",
  meera:
    "https://api.dicebear.com/8.x/lorelei/svg?seed=Meera&backgroundColor=ffd5dc",
  rahul:
    "https://api.dicebear.com/8.x/lorelei/svg?seed=Rahul&backgroundColor=d1f0b0",
  anika:
    "https://api.dicebear.com/8.x/lorelei/svg?seed=Anika&backgroundColor=ffdfbf",
};

// Notebook covers — curated Unsplash photos (direct CDN, no API key)
const covers = {
  mindful:
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80", // calm morning
  travel:
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80", // travel landscape
  growth:
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80", // green plant growth
  devTeam:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80", // team working
  bookClub:
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80", // books
};

// Entry images — thematic Unsplash photos
const imgs = {
  tea: "https://images.unsplash.com/photo-1544025162-d76694265947?w=900&q=80", // morning tea
  rishikesh:
    "https://images.unsplash.com/photo-1610631787813-9eeb1a2386cc?w=900&q=80", // Rishikesh river
  coorg: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=900&q=80", // coffee plantation
  code: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=900&q=80", // coding screen
  bookshelf:
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=900&q=80", // bookshelf
  gratitude:
    "https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=900&q=80", // sunrise hope
  letter:
    "https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=900&q=80", // writing letter
  collab:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=80", // team collab
};

// Public sample audio files (archive.org / freesound public samples)
const audios = {
  ambient: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  nature: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  piano: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
};

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🗑️  Wiping all existing data...");
  await prisma.communityPost.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.entryAttachment.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.journalMember.deleteMany();
  await prisma.notebook.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅  Database cleared.\n");

  // ── 1. Primary user ──────────────────────────────────────────────────────
  console.log("👤 Creating primary user...");
  const salt = await bcrypt.genSalt(12);
  const pw = await bcrypt.hash("Piyush1316", salt);

  const me = await prisma.user.create({
    data: {
      email: "pmiaynushi3@gmail.com",
      fullName: "Piyush Singh",
      passwordHash: pw,
      isVerified: true,
      avatarUrl: avatars.piyush,
      settings: { create: { theme: "light" } },
    },
  });

  // ── 2. Ghost users ───────────────────────────────────────────────────────
  console.log("👥 Creating ghost users...");
  const ghostPw = await bcrypt.hash("Demo@1234", salt);
  const mkGhost = async (email, fullName, avatarUrl) =>
    prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash: ghostPw,
        isVerified: true,
        avatarUrl,
        settings: { create: { theme: "system" } },
      },
    });

  const aarav = await mkGhost(
    "aarav.sharma@demo.dev",
    "Aarav Sharma",
    avatars.aarav,
  );
  const meera = await mkGhost(
    "meera.iyer@demo.dev",
    "Meera Iyer",
    avatars.meera,
  );
  const rahul = await mkGhost(
    "rahul.kapoor@demo.dev",
    "Rahul Kapoor",
    avatars.rahul,
  );
  const anika = await mkGhost(
    "anika.gupta@demo.dev",
    "Anika Gupta",
    avatars.anika,
  );

  // ── 3. Notebooks ────────────────────────────────────────────────────────
  console.log("📓 Creating notebooks...");
  const mkNb = (data) => prisma.notebook.create({ data });

  const n = {
    mindful: await mkNb({
      title: "Mindful Mornings",
      description:
        "Daily reflections and morning intentions to start the day with clarity.",
      coverImage: covers.mindful,
      type: "personal",
      userId: me.id,
    }),
    travel: await mkNb({
      title: "Wanderlust Diaries",
      description:
        "Memories and moments from every corner of the world I've explored.",
      coverImage: covers.travel,
      type: "personal",
      userId: me.id,
    }),
    growth: await mkNb({
      title: "Personal Growth Log",
      description:
        "Tracking habits, learnings and milestones on the journey to becoming better.",
      coverImage: covers.growth,
      type: "personal",
      userId: me.id,
    }),
    devTeam: await mkNb({
      title: "Dev Team Chronicles",
      description:
        "Shared space for the team's technical wins, war stories and lessons learned.",
      coverImage: covers.devTeam,
      type: "team",
      inviteCode: "dev-team-2025",
      userId: me.id,
    }),
    bookClub: await mkNb({
      title: "The Reading Circle",
      description:
        "Monthly reads, quotes and lively discussions from our online book club.",
      coverImage: covers.bookClub,
      type: "team",
      inviteCode: "reading-circle-rsvp",
      userId: me.id,
    }),
  };

  // Team memberships
  for (const nb of [n.devTeam, n.bookClub]) {
    await prisma.journalMember.create({
      data: { userId: me.id, notebookId: nb.id, role: "owner" },
    });
  }
  for (const u of [aarav, meera, rahul]) {
    await prisma.journalMember.create({
      data: { userId: u.id, notebookId: n.devTeam.id, role: "editor" },
    });
  }
  for (const u of [meera, anika]) {
    await prisma.journalMember.create({
      data: { userId: u.id, notebookId: n.bookClub.id, role: "editor" },
    });
  }

  // ── 4. Entries ───────────────────────────────────────────────────────────
  console.log("✍️  Creating entries...");
  const mkEntry = (data) => prisma.journalEntry.create({ data });

  const entries = [];

  // Mindful Mornings
  entries.push(
    await mkEntry({
      title: "The Day I Chose Silence",
      content: wrapHtml([
        "Woke up at 5:30 AM today. No alarm — just the natural rhythm my body has started to adopt since beginning this practice.",
        "The city outside is still asleep. A cup of green tea, and the only sound is the fan overhead. I've been chasing this feeling for months.",
        "My intention for today: <strong>be present in every conversation</strong>. When someone speaks, truly listen. Don't think about what I'll say next.",
        "Mood after writing: Grounded. Ready. Grateful for this quiet morning.",
      ]),
      mood: "calm",
      date: ago(1),
      shareMode: "private",
      userId: me.id,
      notebookId: n.mindful.id,
    }),
  ); // 0

  entries.push(
    await mkEntry({
      title: "Gratitude in the Mundane",
      content: wrapHtml([
        "Three things I'm grateful for today:",
        "<strong>1. The way sunlight hits the kitchen tiles at 7 AM.</strong> I never noticed it before this week. It's genuinely beautiful.",
        "<strong>2. Chai that my neighbor made and left at the door.</strong> Small kindnesses are the backbone of the world.",
        "<strong>3. The fact that I have a skill that lets me build things from nothing.</strong> Writing code feels like magic on good days. Today was a good day.",
        "I want to carry this lens into the harder days. Mundane moments contain multitudes.",
      ]),
      mood: "happy",
      date: ago(3),
      shareMode: "community",
      isAnonymous: false,
      userId: me.id,
      notebookId: n.mindful.id,
    }),
  ); // 1

  entries.push(
    await mkEntry({
      title: "When Anxiety Speaks",
      content: wrapHtml([
        "Last night was rough. The thoughts that usually stay quiet grew loud — the kind of spiraling that starts with 'what if' and doesn't stop.",
        "I sat with it instead of running to my phone. Just breathed. Noticed where the tension was (chest, shoulders). Let it speak.",
        "Anxiety, I've learned, is often just a signal. It was saying: you care about this. That's not a flaw. That's human.",
        "I wrote for 20 minutes without stopping. By the end, the spiral had lost its grip. The page held what my mind couldn't.",
      ]),
      mood: "anxious",
      date: ago(7),
      shareMode: "community",
      isAnonymous: true,
      userId: me.id,
      notebookId: n.mindful.id,
    }),
  ); // 2

  entries.push(
    await mkEntry({
      title: "Evening Reflection — The Week in Review",
      content: wrapHtml([
        "What went well this week? Built the authentication module for Dearly. It works, it's clean, I'm proud of it.",
        "What didn't go well? I skipped gym three times. The excuses were valid but they were still excuses.",
        "What am I carrying forward? The habit of reading 20 pages before bed. Six consecutive days now.",
        "Word of the week: <em>Patience.</em> Good things are taking their time. That's okay.",
      ]),
      mood: "reflective",
      date: ago(5),
      shareMode: "private",
      userId: me.id,
      notebookId: n.mindful.id,
    }),
  ); // 3

  // Travel
  entries.push(
    await mkEntry({
      title: "Rishikesh: Where the River Forgives",
      content: wrapHtml([
        "The Ganga at Rishikesh doesn't politely flow — it <em>surges</em>. White and fierce and impossibly cold when you wade in.",
        "We arrived at dusk just as the aarti was beginning. Hundreds of diyas on the water, smoke, bells, chanting. I'm not particularly religious but I cried.",
        "Stayed in a small ashram on the far bank. Yoga at 6 AM on an open terrace with a mountain at my back. This is what people mean when they say travel changed them.",
        "Tomorrow: white-water rafting. I am mildly terrified. Mostly excited.",
      ]),
      mood: "excited",
      date: ago(30),
      shareMode: "community",
      isAnonymous: false,
      userId: me.id,
      notebookId: n.travel.id,
    }),
  ); // 4

  entries.push(
    await mkEntry({
      title: "Coorg in the Rain",
      content: wrapHtml([
        "Nobody told me Coorg during monsoon would look like a different planet. Green so intense it seems fake. Rain that doesn't stop but somehow doesn't annoy you.",
        "Ate three cups of filter coffee at the estate. The owner, a retired teacher, told me stories about the freedom movement. Her grandfather had hidden Congress workers in the coffee storage rooms.",
        "History lives in houses. I keep forgetting that.",
        "On the hike, the mist rolled in so thick we lost the path twice. Everything smelled like earth and rain and green. I want to go back before anything changes.",
      ]),
      mood: "calm",
      date: ago(62),
      shareMode: "community",
      isAnonymous: false,
      userId: me.id,
      notebookId: n.travel.id,
    }),
  ); // 5

  // Growth
  entries.push(
    await mkEntry({
      title: "Why I Started Building in Public",
      content: wrapHtml([
        "Fear of judgment kept me silent for two years. Every project I built quietly, shipped or deleted it, moved on.",
        "Then I tweeted the first Dearly screenshot expecting nothing. Twelve people followed. Two DM'd asking to beta test. I laughed out loud — not at them, at myself for hiding.",
        "Building in public isn't about the numbers. It's about the commitment mechanism. When you tell the world you're working on something, the decision to quit becomes a public one.",
        "I'm not quitting. This journal app feels like the clearest expression of something I care about: writing as thinking, sharing as connection.",
      ]),
      mood: "excited",
      date: ago(15),
      shareMode: "community",
      isAnonymous: false,
      userId: me.id,
      notebookId: n.growth.id,
    }),
  ); // 6

  entries.push(
    await mkEntry({
      title: "30 Days of No Social Media — What I Found",
      content: wrapHtml([
        "Day 1 was easy. Day 3 was genuinely difficult — I kept reaching for my phone out of pure muscle memory.",
        "By day 10, something shifted. My reading improved. I started cooking again. I called three friends I hadn't spoken to in months.",
        "The most surprising lesson: boredom is not the enemy. Boredom is the incubator. My best ideas came in moments that social media used to fill.",
        "I'm back on it now, but differently. Intentional sessions. No notifications. The relationship changed, and I think that's what matters.",
      ]),
      mood: "reflective",
      date: ago(22),
      shareMode: "community",
      isAnonymous: false,
      userId: me.id,
      notebookId: n.growth.id,
    }),
  ); // 7

  // Dev Team Chronicles
  entries.push(
    await mkEntry({
      title: "We Shipped Real-Time Collaboration 🎉",
      content: wrapHtml([
        "Three weeks of Yjs, socket.io, and many late-night debugging sessions. It works.",
        "You can now co-write entries with your team in real-time — watching each other's cursors, seeing changes appear live. It felt like magic when it first clicked.",
        "Biggest challenge: conflict resolution when two people edit the same paragraph simultaneously. Yjs handles this elegantly under the hood.",
        "Shoutout to Aarav for fixing the CORS issue that broke staging for a full day. We owe you chai.",
      ]),
      mood: "excited",
      date: ago(4),
      shareMode: "private",
      userId: me.id,
      notebookId: n.devTeam.id,
    }),
  ); // 8

  entries.push(
    await mkEntry({
      title: "The Day the DB Migration Went Wrong",
      content: wrapHtml([
        "There are lessons you learn from docs and lessons you learn from breaking production. Today was the second kind.",
        "A Prisma schema migration dropped a column we thought was unused. It wasn't. Three hours of rollback, panic, and very fast typing later, we were back.",
        "The fix: we now test all migrations on a staging branch before touching main.",
        "On the bright side, this is exactly why we journal as a team — so future-us never makes this mistake twice.",
      ]),
      mood: "sad",
      date: ago(18),
      shareMode: "private",
      userId: aarav.id,
      notebookId: n.devTeam.id,
    }),
  ); // 9

  entries.push(
    await mkEntry({
      title: "API Design Retrospective",
      content: wrapHtml([
        "Spent today auditing our REST endpoints. Key observations:",
        "We have inconsistent naming — some routes use camelCase params, some kebab-case. Must standardize before v1.",
        "The notebook membership endpoint does too much. It should be split into invite, accept, and remove operations.",
        "Overall the architecture is solid. Express + Prisma is a joy for a CRUD-heavy app like this.",
      ]),
      mood: "reflective",
      date: ago(11),
      shareMode: "private",
      userId: meera.id,
      notebookId: n.devTeam.id,
    }),
  ); // 10

  // Book Club
  entries.push(
    await mkEntry({
      title: "Atomic Habits — Month 1 Reflections",
      content: wrapHtml([
        "This month's read: Atomic Habits by James Clear. Short review: transformative, practical, occasionally obvious but always well-argued.",
        "<strong>The idea that stuck:</strong> You don't rise to your goals, you fall to your systems.",
        "I've been tracking a 5-minute journaling habit (meta, I know). Seventeen days in. The streak matters less than the identity.",
        "What's your one habit from this book? Share in the replies.",
      ]),
      mood: "happy",
      date: ago(9),
      shareMode: "community",
      isAnonymous: false,
      userId: me.id,
      notebookId: n.bookClub.id,
    }),
  ); // 11

  entries.push(
    await mkEntry({
      title: "The Alchemist — Discussion Notes",
      content: wrapHtml([
        "Meera called it 'a beautiful fable with unearned wisdom'. I thought that was a bit harsh but not entirely wrong.",
        "What I loved: the language of omens and the universe conspiring with you. Naive, yes. Comforting, also yes.",
        "What frustrated me: the passivity of Santiago. Things happen <em>to</em> him more than he makes them happen.",
        "Quote that hit hardest: <em>'When you want something, all the universe conspires in helping you to achieve it.'</em>",
      ]),
      mood: "reflective",
      date: ago(40),
      shareMode: "community",
      isAnonymous: false,
      userId: anika.id,
      notebookId: n.bookClub.id,
    }),
  ); // 12

  // Standalone community entries
  entries.push(
    await mkEntry({
      title: "Letter to My Younger Self",
      content: wrapHtml([
        "Dear 16-year-old me,",
        "The thing you're most ashamed of right now will be the thing that makes you most compassionate later. Hold onto that.",
        "You'll lose friends. Some will come back in better versions of the relationship. Some won't. Both outcomes are okay.",
        "Start journaling. I know that sounds corny. Do it anyway. Your future self will feel less alone because of it.",
        "With love, <em>Piyush</em>",
      ]),
      mood: "reflective",
      date: ago(6),
      shareMode: "community",
      isAnonymous: false,
      userId: me.id,
      notebookId: null,
    }),
  ); // 13

  entries.push(
    await mkEntry({
      title: "The Strange Peace of 2 AM",
      content: wrapHtml([
        "I've always done my best thinking at 2 AM. There's something about the silence — not just of sound, but of expectation.",
        "No meetings. No notifications. No one needing anything. The world has given you temporary permission to just <em>exist</em>.",
        "Built half the Dearly frontend in late-night sessions. Wrote three poems I'll never show anyone. Decided to quit and then un-quit twice.",
        "Whoever you are reading this in the community feed: I hope your 2 AM is treating you well tonight.",
      ]),
      mood: "calm",
      date: ago(2),
      shareMode: "community",
      isAnonymous: true,
      userId: rahul.id,
      notebookId: null,
    }),
  ); // 14

  entries.push(
    await mkEntry({
      title: "I Cried Watching a Cooking Video",
      content: wrapHtml([
        "Hear me out. It was a video of an old man making dal for his grandson. Thirty-two million views. Comments full of people missing their grandparents.",
        "I've been under enormous pressure at work and I think I'd compressed every feeling into a very small space. The video found a crack and everything came out at once.",
        "Crying for no big reason is sometimes crying for every small reason. The body keeps score.",
        "Feeling lighter now. Dal for dinner. Will call grandmother tomorrow.",
      ]),
      mood: "sad",
      date: ago(14),
      shareMode: "community",
      isAnonymous: true,
      userId: meera.id,
      notebookId: null,
    }),
  ); // 15

  // ── 5. Entry Attachments (images + audio) ───────────────────────────────
  console.log("🖼️  Adding media attachments...");

  const attachDefs = [
    // Entry 0 – morning tea photo
    { idx: 0, url: imgs.tea, fileType: "image" },
    // Entry 1 – sunrise gratitude
    { idx: 1, url: imgs.gratitude, fileType: "image" },
    // Entry 1 – morning voice note
    { idx: 1, url: audios.ambient, fileType: "audio" },
    // Entry 4 – Rishikesh river
    { idx: 4, url: imgs.rishikesh, fileType: "image" },
    // Entry 4 – nature ambient audio from trip
    { idx: 4, url: audios.nature, fileType: "audio" },
    // Entry 5 – Coorg coffee plantation
    { idx: 5, url: imgs.coorg, fileType: "image" },
    // Entry 6 – dev at laptop
    { idx: 6, url: imgs.code, fileType: "image" },
    // Entry 8 – team collaboration
    { idx: 8, url: imgs.collab, fileType: "image" },
    // Entry 11 – bookshelf
    { idx: 11, url: imgs.bookshelf, fileType: "image" },
    // Entry 13 – letter writing photo
    { idx: 13, url: imgs.letter, fileType: "image" },
    // Entry 3 – evening piano voice note
    { idx: 3, url: audios.piano, fileType: "audio" },
  ];

  for (const { idx, url, fileType } of attachDefs) {
    if (!entries[idx]) continue;
    await prisma.entryAttachment.create({
      data: { url, fileType, entryId: entries[idx].id },
    });
  }

  // ── 6. Tags ─────────────────────────────────────────────────────────────
  console.log("🏷️  Creating tags...");
  const tagDefs = [
    { name: "mindfulness", idxs: [0, 1, 3] },
    { name: "gratitude", idxs: [1] },
    { name: "anxiety", idxs: [2] },
    { name: "morning-pages", idxs: [0, 3] },
    { name: "travel", idxs: [4, 5] },
    { name: "india", idxs: [4, 5] },
    { name: "growth", idxs: [6, 7] },
    { name: "coding", idxs: [6, 8] },
    { name: "teamwork", idxs: [8, 9, 10] },
    { name: "books", idxs: [11, 12] },
    { name: "nostalgia", idxs: [13] },
    { name: "late-night", idxs: [14] },
    { name: "social-media", idxs: [7] },
  ];
  for (const { name, idxs } of tagDefs) {
    await prisma.tag.create({
      data: {
        name,
        userId: me.id,
        entries: {
          connect: idxs
            .filter((i) => entries[i])
            .map((i) => ({ id: entries[i].id })),
        },
      },
    });
  }

  // ── 7. Community Posts ───────────────────────────────────────────────────
  console.log("🌐 Creating community posts...");
  for (const e of entries) {
    if (e.shareMode !== "community") continue;
    await prisma.communityPost.upsert({
      where: { entryId: e.id },
      update: {},
      create: {
        entryId: e.id,
        isAnonymous: e.isAnonymous,
        notebookId: e.notebookId,
      },
    });
  }

  // ── 8. Reactions ─────────────────────────────────────────────────────────
  console.log("❤️  Adding reactions...");
  const reax = [
    { e: 1, u: aarav, t: "heart" },
    { e: 1, u: meera, t: "heart" },
    { e: 1, u: rahul, t: "support" },
    { e: 1, u: anika, t: "thoughtful" },
    { e: 2, u: meera, t: "support" },
    { e: 2, u: anika, t: "support" },
    { e: 2, u: rahul, t: "heart" },
    { e: 2, u: aarav, t: "thoughtful" },
    { e: 4, u: aarav, t: "heart" },
    { e: 4, u: meera, t: "heart" },
    { e: 4, u: anika, t: "support" },
    { e: 5, u: rahul, t: "heart" },
    { e: 5, u: aarav, t: "thoughtful" },
    { e: 6, u: aarav, t: "support" },
    { e: 6, u: rahul, t: "heart" },
    { e: 7, u: meera, t: "thoughtful" },
    { e: 7, u: anika, t: "support" },
    { e: 11, u: meera, t: "heart" },
    { e: 11, u: anika, t: "thoughtful" },
    { e: 12, u: me, t: "thoughtful" },
    { e: 12, u: rahul, t: "heart" },
    { e: 13, u: meera, t: "heart" },
    { e: 13, u: aarav, t: "thoughtful" },
    { e: 13, u: anika, t: "support" },
    { e: 13, u: rahul, t: "heart" },
    { e: 14, u: me, t: "heart" },
    { e: 14, u: aarav, t: "thoughtful" },
    { e: 14, u: anika, t: "heart" },
    { e: 15, u: me, t: "support" },
    { e: 15, u: aarav, t: "support" },
    { e: 15, u: anika, t: "heart" },
  ];
  for (const { e, u, t } of reax) {
    if (!entries[e]) continue;
    await prisma.reaction.upsert({
      where: { userId_entryId: { userId: u.id, entryId: entries[e].id } },
      update: {},
      create: { type: t, userId: u.id, entryId: entries[e].id },
    });
  }

  // ── 9. Comments ──────────────────────────────────────────────────────────
  console.log("💬 Adding comments...");
  const comments = [
    {
      e: 1,
      u: meera,
      c: "The sunlight on kitchen tiles hit me differently. Thank you for writing this.",
    },
    {
      e: 1,
      u: aarav,
      c: "This is exactly the reminder I needed today. Small things carry so much weight.",
    },
    {
      e: 2,
      u: anika,
      c: "Anxiety as a signal, not a flaw — I'll be sitting with this for a while. Thank you.",
    },
    {
      e: 2,
      u: rahul,
      c: "The page held what my mind couldn't. You put it perfectly.",
    },
    { e: 2, u: meera, c: "You're not alone in this. Not even close." },
    {
      e: 4,
      u: aarav,
      c: "You've made me miss a place I've never been. Magical description.",
    },
    { e: 4, u: anika, c: "Please do write the white-water rafting entry! 🙏" },
    {
      e: 5,
      u: rahul,
      c: "History lives in houses — this sentence belongs on a wall somewhere.",
    },
    {
      e: 6,
      u: rahul,
      c: "This is the push I needed to put my own project online. Sending it today.",
    },
    {
      e: 6,
      u: meera,
      c: "The commitment mechanism framing is so smart. Sharing this.",
    },
    {
      e: 7,
      u: anika,
      c: "Day 3 of no social media was exactly like you described. Muscle memory is wild.",
    },
    {
      e: 7,
      u: aarav,
      c: "Boredom as incubator — this is the reframe I needed.",
    },
    {
      e: 11,
      u: meera,
      c: "Building a 10-min reading habit after this. Day 4 and going strong.",
    },
    {
      e: 11,
      u: anika,
      c: "Systems over goals is my new mantra. Life-changing.",
    },
    {
      e: 12,
      u: me,
      c: "The universe conspiring — I want to believe it too. Most days I do.",
    },
    {
      e: 13,
      u: meera,
      c: "Reading this at the exact right moment. Thank you.",
    },
    {
      e: 13,
      u: aarav,
      c: "The shame-to-compassion arc is profound. Real wisdom here.",
    },
    { e: 13, u: anika, c: "Made me want to write one of these too." },
    { e: 14, u: me, c: "2 AM is sacred. Protect it at all costs." },
    {
      e: 15,
      u: me,
      c: "Crying for every small reason at once. This is so human and so true.",
    },
    {
      e: 15,
      u: anika,
      c: "Hope your call with your grandmother goes wonderfully 🤍",
    },
  ];
  for (const { e, u, c } of comments) {
    if (!entries[e]) continue;
    await prisma.comment.create({
      data: { content: c, userId: u.id, entryId: entries[e].id },
    });
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n✅  DB seeded successfully!");
  console.log("─────────────────────────────────────────────────");
  console.log(`👤 Account:     pmiaynushi3@gmail.com / Piyush1316`);
  console.log(
    `📓 Notebooks:   ${Object.keys(n).length} (3 personal, 2 team — all with cover images)`,
  );
  console.log(`✍️  Entries:     ${entries.length}`);
  console.log(`🖼️  Attachments: ${attachDefs.length} (images + voice notes)`);
  console.log(`❤️  Reactions:   ${reax.length}`);
  console.log(`💬 Comments:    ${comments.length}`);
  console.log("─────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌  Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
