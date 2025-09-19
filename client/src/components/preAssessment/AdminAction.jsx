import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useEvaluateSubmissionMutation } from "@/store/apiSlices/preAssessmentApiSlice";

const AdminAction = ({ submissionId, currentUser }) => {
  const [msgForUser, setMsgForUser] = useState("");
  const [status, setStatus] = useState(""); // "accept" or "reject"

  const [evaluateSubmission, { error: errorEvaluating, isLoading }] =
    useEvaluateSubmissionMutation();

  const handleEvaluate = async () => {
    if (currentUser?.role !== "admin") {
      console.log(currentUser);
      console.error("You are not admin");
      return;
    }
    if (!submissionId) {
      console.error("Submission Id not found");
      return;
    }

    try {
      const payload = {
        status, // required
        reason: msgForUser || null, // optional
      };

      await evaluateSubmission({
        submissionId, // goes into the URL
        payload, // goes into request body
      }).unwrap();

      console.log("Evaluation submitted");
    } catch (error) {
      console.error("Error in evaluation", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild className="text-right">
        <Button className="w-1/2">Evaluate</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Evaluate the Assessment</DialogTitle>
        </DialogHeader>
        <DialogDescription>Evaluate status of the assessment</DialogDescription>

        <RadioGroup
          className="flex"
          value={status}
          onValueChange={(value) => setStatus(value)}
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="accept" id="approve_" />
            <Label htmlFor="approve_">Approve</Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="reject" id="reject_" />
            <Label htmlFor="reject_">Reject</Label>
          </div>
        </RadioGroup>

        <Label htmlFor="msgForUser">Message for User</Label>
        <Textarea
          id="msgForUser"
          value={msgForUser}
          onChange={(e) => setMsgForUser(e.target.value)}
        />

        <DialogFooter>
          <Button onClick={handleEvaluate} disabled={isLoading || !status}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAction;
