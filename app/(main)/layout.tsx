import { redirect } from "next/navigation";

import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { WhatsNewModal } from "@/components/modals/whats-new-modal";
import { getUserProgress } from "@/db/queries";
import { getLatestAnnouncement } from "@/lib/whats-new";

type Props = {
  children: React.ReactNode;
};

const MainLayout = async ({
  children,
}: Props) => {
  const userProgress = await getUserProgress();

  if (!userProgress || !userProgress.gender) {
    redirect("/profile-setup");
  }

  const latestAnnouncement = getLatestAnnouncement();

  return (
    <>
      <MobileHeader />
      <Sidebar className="hidden lg:flex" />
      <main className="lg:pl-[256px] h-full pt-[50px] lg:pt-0">
        <div className="max-w-[1056px] mx-auto pt-6 h-full">
          {children}
        </div>
      </main>
      {latestAnnouncement && (
        <WhatsNewModal
          announcement={latestAnnouncement}
          alreadySeen={userProgress.lastSeenAnnouncementId === latestAnnouncement.id}
        />
      )}
    </>
  );
};
 
export default MainLayout;
