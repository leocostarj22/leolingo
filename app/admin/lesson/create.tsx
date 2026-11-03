import { SimpleForm, Create, TextInput, ReferenceInput, NumberInput, SelectInput, required } from "react-admin";

import { LESSON_ICON_MAP } from "@/lib/lesson-icons";

const iconChoices = Object.keys(LESSON_ICON_MAP).map((id) => ({ id, name: id }));

export const LessonCreate = () => {
  return (
    <Create>
      <SimpleForm>
        <TextInput
          source="title"
          validate={[required()]}
          label="Title"
        />
        <ReferenceInput
          source="unitId"
          reference="units"
        />
        <NumberInput
          source="order"
          validate={[required()]}
          label="Order"
        />
        <SelectInput
          source="icon"
          choices={iconChoices}
          validate={[required()]}
          label="Icon"
        />
      </SimpleForm>
    </Create>
  );
};
