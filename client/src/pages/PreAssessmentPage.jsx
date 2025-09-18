import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { selectAuth } from "@/store/appSlices/authSlice";
import { useSelector } from "react-redux";
import PreAssessmentsDash from "@/components/preAssessment/PreAssessmentsDash";
import PreAssessmentSubmission from "@/components/preAssessment/PreAssessmentSubmission";

const PreAssessmentPage = () => {
  const user = useSelector(selectAuth);
  const [currentContent, setCurrentContent] = useState(
    user?.role === "admin" ? "inspect" : "user"
  );

  const handleTabChange = (e) => {
    setCurrentContent(e.target.name);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden gap-4">
      {/* Top Card (tabs) */}
      <Card className="w-full shrink-0">
        <CardContent className="flex gap-2 w-full flex-wrap justify-center items-center p-2">
          <Button
            variant={currentContent === "user" ? "default" : "secondary"}
            name="user"
            onClick={handleTabChange}
          >
            Fill Assessment
          </Button>
          {user?.role === "admin" && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={currentContent === "modify" ? "default" : "secondary"}
                name="modify"
                onClick={handleTabChange}
              >
                Modify
              </Button>
              <Button
                variant={currentContent === "inspect" ? "default" : "secondary"}
                name="inspect"
                onClick={handleTabChange}
              >
                Assess
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Card (fills remaining height, scrolls internally) */}
      <Card className="flex-1 min-h-0 overflow-hidden">
        <CardContent className="h-full overflow-y-auto p-4">
          {currentContent === "modify" && <PreAssessmentsDash />}
          {currentContent === "user" && <PreAssessmentSubmission />}
          {currentContent === "inspect" && <div>Inspection view goes here</div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default PreAssessmentPage;
