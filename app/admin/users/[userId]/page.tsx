import { notFound, redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin";
import { getLessonsForCourse, getUserProgressByIdForAdmin } from "@/db/admin-queries";

import { UserEditForm } from "./user-edit-form";

type Props = {
  params: {
    userId: string;
  };
};

const AdminUserEditPage = async ({ params }: Props) => {
  if (!isAdmin()) {
    redirect("/");
  }

  const user = await getUserProgressByIdForAdmin(params.userId);

  if (!user) {
    notFound();
  }

  const lessons = user.activeCourse
    ? await getLessonsForCourse(user.activeCourse.id)
    : [];

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-neutral-800">
        Editar conta: {user.userName} {user.lastName ?? ""}
      </h1>

      <UserEditForm user={user} lessons={lessons} />
    </div>
  );
};

export default AdminUserEditPage;
