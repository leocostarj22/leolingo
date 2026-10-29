import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { getUserProgress } from "@/db/queries";

import { ProfileForm } from "./profile-form";

const ProfileSetupPage = async () => {
  const userProgressData = getUserProgress();
  const userData = currentUser();

  const [userProgress, user] = await Promise.all([
    userProgressData,
    userData,
  ]);

  if (userProgress?.gender) {
    redirect("/courses");
  }

  return (
    <ProfileForm
      defaultFirstName={user?.firstName ?? ""}
      defaultLastName={user?.lastName ?? ""}
    />
  );
};

export default ProfileSetupPage;
