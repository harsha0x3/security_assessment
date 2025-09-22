from models.schemas.pre_assessment_schema import DefaultQuestions

instance = DefaultQuestions()
print(instance.app_name)

for field_name, field in DefaultQuestions.model_fields.items():
    print(field)
