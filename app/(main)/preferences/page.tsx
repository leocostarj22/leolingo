import { getUserProgress } from "@/db/queries";

import { PreferencesForm } from "./preferences-form";

const PreferencesPage = async () => {
  const userProgress = await getUserProgress();

  return (
    <PreferencesForm
      initialEnglishLevel={userProgress?.englishLevel ?? null}
      initialLearningGoal={userProgress?.learningGoal ?? null}
    />
  );
};

export default PreferencesPage;
