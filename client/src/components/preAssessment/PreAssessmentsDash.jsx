import React, { useEffect, useMemo, useState } from "react";
import {
  useGetAssessmentsQuery,
  useGetSectionsQuery,
  useGetSectionQuestionsQuery,
} from "@/store/apiSlices/preAssessmentApiSlice";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/Card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Combobox } from "../core/ui/Combobox";
import AssessmentDialogForm from "./AssessmentModal";
import SectionDialogForm from "./SectionModal";
import QuestionsDialogForm from "./QuestionModal";
import { toast } from "react-toastify";
import { BadgeQuestionMark } from "lucide-react";

const PreAssessmentsDash = () => {
  const {
    data: allAssessments = [],
    isSuccess: assessmentsFetched,
    refetch: refetchAssessments,
  } = useGetAssessmentsQuery();

  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [currentQ, setCurrentQ] = useState(null);

  // Dialog states
  const [assessmentCreateDialogOpen, setAssessmentCreateDialogOpen] =
    useState(false);
  const [assessmentEditDialogOpen, setAssessmentEditDialogOpen] =
    useState(false);
  const [sectionCreateDialogOpen, setSectionCreateDialogOpen] = useState(false);
  const [sectionEditDialogOpen, setSectionEditDialogOpen] = useState(false);

  const [qCreateDialogOpen, setQCreateDialogOpen] = useState(false);
  const [qTargetSection, setQTargetSection] = useState(null);
  const [qEditDialogOpen, setQEditDialogOpen] = useState(false);

  const [editingAssessment, setEditingAssessment] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingQ, setEditingQ] = useState(null);

  const {
    data: allSections,
    isSuccess: sectionsFetched,
    refetch: refetchSections,
  } = useGetSectionsQuery(currentAssessment?.id, {
    skip: !currentAssessment && !currentAssessment?.id,
  });
  const {
    data: sectionQuestions,
    isSuccess: sectionQsFetched,
    refetch: refetchQs,
  } = useGetSectionQuestionsQuery(currentSection?.id, {
    skip: !currentSection && !currentSection?.id,
  });

  if (sectionsFetched) {
    console.log("Current ass", currentAssessment);
    console.log("SECTIONS", allSections);
  }

  if (sectionQsFetched) {
    console.log("QUESTON", sectionQuestions);
  }

  // initialize to first assessment when data arrives
  useEffect(() => {
    if (
      assessmentsFetched &&
      Array.isArray(allAssessments) &&
      allAssessments.length > 0 &&
      (currentAssessment === null || currentAssessment === undefined)
    ) {
      const first = allAssessments[0];
      setCurrentAssessment(first ?? null);
      console.log("Current ass", currentAssessment);
    }
  }, [assessmentsFetched, allAssessments, currentAssessment]);

  useEffect(() => {
    if (
      sectionsFetched &&
      Array.isArray(allSections) &&
      allSections.length > 0 &&
      !currentSection
    ) {
      setCurrentSection(allSections[0]);
    }
  }, [allSections, sectionsFetched, currentSection]);

  // build assessmentItems with safe fallbacks
  const assessmentItems = useMemo(
    () =>
      (allAssessments || []).map((assessment) => ({
        value: assessment?.id ?? assessment?.assessmentId,
        label:
          assessment?.assessment_type ??
          assessment?.name ??
          String(assessment?.id ?? assessment?.assessmentId ?? "Unknown"),
        // Pass the full assessment object for edit/delete operations
        ...assessment,
      })),
    [allAssessments]
  );

  const handleAssessmentCreateSuccess = () => {
    refetchAssessments();
    toast.info({
      title: "Success",
      description: "Assessment created successfully!",
    });
  };

  const handleAssessmentEditSuccess = () => {
    refetchAssessments();
    toast.info({
      title: "Success",
      description: "Assessment updated successfully!",
    });
  };

  const handleAssessmentEdit = (item) => {
    // Find the full assessment object
    const fullAssessment = allAssessments.find(
      (a) =>
        String(a.id) === String(item.value) ||
        String(a.assessmentId) === String(item.value)
    );
    setEditingAssessment(fullAssessment);
    setAssessmentEditDialogOpen(true);
  };

  const handleAssessmentDelete = async (item) => {
    if (window.confirm("Are you sure you want to delete this assessment?")) {
      try {
        // await deleteAssessment({ id: item.value }).unwrap();
        console.log("ITEM DELETEd", item);
        // If we're deleting the currently selected assessment, reset selection
        if (String(currentAssessment?.id) === String(item.value)) {
          setCurrentAssessment(null);
          setCurrentSection(null);
        }

        refetchAssessments();
        toast.info({
          title: "Success",
          description: "Assessment deleted successfully!",
        });
      } catch (error) {
        console.error("Error deleting assessment:", error);
        toast.error({
          title: "Error",
          description: "Failed to delete assessment. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSectionCreateSuccess = () => {
    refetchSections();
    toast.info({
      title: "Success",
      description: "Section created successfully!",
    });
  };

  const handleSectionEditSuccess = () => {
    refetchSections();
    toast.info({
      title: "Success",
      description: "Section updated successfully!",
    });
  };

  const handleSectionEdit = (section) => {
    setEditingSection(section);
    setSectionEditDialogOpen(true);
  };

  const handleSectionDelete = async (item) => {
    if (window.confirm("Are you sure you want to delete this section?")) {
      try {
        // await deleteAssessment({ id: item.value }).unwrap();
        console.log("Section ITEM DELETEd", item);
        // If we're deleting the currently selected assessment, reset selection
        if (String(currentSection?.id) === String(item.value)) {
          setCurrentSection(null);
          setCurrentQ(null);
        }
      } catch (error) {
        console.error("Error deleting section:", error);
        toast.error({
          title: "Error",
          description: "Failed to delete section. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleQCreateSuccess = () => {
    refetchQs();
    toast.info({
      title: "Success",
      description: "Questions created successfully!",
    });
  };

  const handleQEditSuccess = () => {
    refetchQs();
    toast.info({
      title: "Success",
      description: "Question updated successfully!",
    });
  };

  const handleQEdit = (question) => {
    setEditingQ(question);
    setQEditDialogOpen(true);
  };

  const handleQDelete = async (item) => {
    if (window.confirm("Are you sure you want to delete this section?")) {
      try {
        // await deleteAssessment({ id: item.value }).unwrap();
        console.log("Section ITEM DELETEd", item);
        // If we're deleting the currently selected assessment, reset selection
      } catch (error) {
        console.error("Error deleting section:", error);
        toast.error({
          title: "Error",
          description: "Failed to delete section. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const customAccordActions = [
    {
      icon: BadgeQuestionMark,
      onClick: (section) => {
        setQTargetSection(section);
        setQCreateDialogOpen(true);
      },
      label: "Add Qs",
    },
  ];

  return (
    <>
      <Card className="border-none shadow-none">
        <CardHeader className="flex w-full">
          <div className="flex gap-2 items-center justify-between">
            {/* Combobox with action menu */}
            <div className="w-80 min-w-0">
              {assessmentsFetched && assessmentItems.length > 0 && (
                <Combobox
                  items={assessmentItems}
                  selectedValue={currentAssessment?.id}
                  onSelect={(value) => {
                    // robust finder - match either id or assessmentId (string-safe)
                    const assessment = allAssessments.find(
                      (a) =>
                        String(a?.id) === String(value) ||
                        String(a?.assessmentId) === String(value)
                    );

                    // set to canonical id when possible, otherwise keep the selected value
                    setCurrentAssessment(assessment);
                    // Reset current section when assessment changes
                    setCurrentSection(null);
                  }}
                  placeHolder="Select an assessment"
                  shouldFilter={true}
                  showActions={true}
                  onEdit={handleAssessmentEdit}
                  onDelete={handleAssessmentDelete}
                />
              )}
            </div>

            {/* Add Assessment Button */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-shrink-0"
                onClick={() => setAssessmentCreateDialogOpen(true)}
              >
                Add Assessment
              </Button>

              {currentAssessment && (
                <Button
                  variant="secondary"
                  className="flex-shrink-0"
                  onClick={() => setSectionCreateDialogOpen(true)}
                >
                  Add Section
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {sectionsFetched &&
            Array.isArray(allSections) &&
            allSections.length > 0 && (
              <Accordion type="single" collapsible>
                {allSections.map((section) => (
                  <AccordionItem
                    value={String(section.id)}
                    key={section.id}
                    showActions={true}
                    onEdit={() => handleSectionEdit(section)}
                    onDelete={() => handleSectionDelete(section)}
                    actionItems={customAccordActions}
                    section={section}
                  >
                    <AccordionTrigger
                      onClick={() => {
                        setCurrentSection(section);
                      }}
                    >
                      {section.title}
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                      {currentSection?.id === section.id &&
                        sectionQsFetched &&
                        Array.isArray(sectionQuestions) && (
                          <ul className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-1/2">
                            {sectionQuestions.map((q, idx) => (
                              <li key={q?.id} className="flex gap-2">
                                <strong>{idx + 1}.</strong>
                                {q?.question_text}
                              </li>
                            ))}
                          </ul>
                        )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
        </CardContent>
      </Card>

      {/* Create Assessment Dialog */}
      <AssessmentDialogForm
        open={assessmentCreateDialogOpen}
        onOpenChange={setAssessmentCreateDialogOpen}
        onSuccess={handleAssessmentCreateSuccess}
      />

      {/* Edit Assessment Dialog */}
      <AssessmentDialogForm
        open={assessmentEditDialogOpen}
        onOpenChange={setAssessmentEditDialogOpen}
        editData={editingAssessment}
        onSuccess={handleAssessmentEditSuccess}
      />

      {/* Create Section Dialog */}
      <SectionDialogForm
        open={sectionCreateDialogOpen}
        onOpenChange={setSectionCreateDialogOpen}
        assessment={currentAssessment}
        onSuccess={handleSectionCreateSuccess}
      />

      {/* Edit Section Dialog */}
      <SectionDialogForm
        open={sectionEditDialogOpen}
        onOpenChange={setSectionEditDialogOpen}
        editData={editingSection}
        onSuccess={handleSectionEditSuccess}
      />

      {/* Create Questions Dialog */}
      <QuestionsDialogForm
        open={qCreateDialogOpen}
        onOpenChange={setQCreateDialogOpen}
        section={qTargetSection}
        onSuccess={handleSectionCreateSuccess}
      />
    </>
  );
};

export default PreAssessmentsDash;
