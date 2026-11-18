"use server";

import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs";

import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";

export const markWhatsNewSeen = async (announcementId: string) => {
  const { userId } = await auth();

  if (!userId) {
    return;
  }

  await db
    .update(userProgress)
    .set({ lastSeenAnnouncementId: announcementId })
    .where(eq(userProgress.userId, userId));
};
