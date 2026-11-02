import { auth } from "@clerk/nextjs"

const adminIds = [
  "user_3LN3ZpiSycpP83mFMmYe9D5cggd",
];

export const isAdmin = () => {
  const { userId } = auth();

  if (!userId) {
    return false;
  }

  return adminIds.indexOf(userId) !== -1;
};
