import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin";
import { getAllUserProgress } from "@/db/admin-queries";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

const AdminUsersPage = async () => {
  if (!isAdmin()) {
    redirect("/");
  }

  const users = await getAllUserProgress();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold text-neutral-800">
        Administração de contas
      </h1>

      <div className="mt-6 overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-100 text-neutral-600">
            <tr>
              <th className="p-3"></th>
              <th className="p-3">Nome</th>
              <th className="p-3">Corações</th>
              <th className="p-3">Pontos</th>
              <th className="p-3">Nível</th>
              <th className="p-3">Objetivo</th>
              <th className="p-3">Curso ativo</th>
              <th className="p-3">Pro</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userId} className="border-t">
                <td className="p-3">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage
                      className="object-cover"
                      src={user.userImageSrc}
                    />
                  </Avatar>
                </td>
                <td className="p-3">
                  {user.userName} {user.lastName ?? ""}
                </td>
                <td className="p-3">{user.hearts}</td>
                <td className="p-3">{user.points}</td>
                <td className="p-3">{user.englishLevel ?? "—"}</td>
                <td className="p-3">{user.learningGoal ?? "—"}</td>
                <td className="p-3">{user.activeCourse?.title ?? "—"}</td>
                <td className="p-3">
                  {user.adminOverridePro ? "Sim" : "Não"}
                </td>
                <td className="p-3">
                  <Link
                    href={`/admin/users/${user.userId}`}
                    className="font-semibold text-sky-600 hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;
