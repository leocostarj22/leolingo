import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { getCourses, getUserProgress } from "@/db/queries";

import { List } from "./list";

const CoursesPage = async () => {
  const coursesData = getCourses();
  const userProgressData = getUserProgress();

  const [
    courses,
    userProgress,
  ] = await Promise.all([
    coursesData,
    userProgressData,
  ]);

  return (
    <div className="h-full">
      <div className="relative -mt-6 w-full lg:hidden">
        <Link
          href="/learn"
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 shadow-md transition hover:bg-white"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700" />
        </Link>
        <div className="relative aspect-[941/620] w-full overflow-hidden lg:rounded-b-[2.5rem]">
          <Image
            src="/courses-background.png"
            alt=""
            fill
            priority
            className="object-cover object-top"
          />
        </div>
      </div>

      <div className="mx-auto max-w-[912px] px-6 pt-6 text-center">
        <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">
          Escolhe o teu idioma
        </h1>
        <p className="mt-1 text-sm text-slate-400 sm:text-base">
          Seleciona o idioma que queres aprender
        </p>
      </div>

      <div className="mx-auto max-w-[912px] px-6 pb-10">
        <List
          courses={courses}
          activeCourseId={userProgress?.activeCourseId}
        />
      </div>
    </div>
  );
};

export default CoursesPage;
