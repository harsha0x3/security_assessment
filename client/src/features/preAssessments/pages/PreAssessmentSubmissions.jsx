import {
  useGetSubmittedAssessmentsQuery,
  useGetAssessmentQuestionnaireQuery,
  useGetSubmittedResponsesQuery,
  useLazyGetAssessmentQuestionnaireQuery,
  useLazyGetSubmittedResponsesQuery,
} from "@/features/preAssessments/store/preAssessmentApiSlice";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
  CardTitle,
} from "../../../components/ui/Card";
import { Label } from "../../../components/ui/label";
import { useMemo, useState } from "react";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import PreAssessmentForm from "../components/PreAssessmentForm";

const PreAssessmentSubmissions = () => {
  const colHelper = createColumnHelper();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const {
    data: subAssessments,
    isLoading: fetchingingSubAss,
    isSuccess: fetchedSubAss,
    error: subAssError,
  } = useGetSubmittedAssessmentsQuery();

  // const {
  //   data: questionnaire,
  //   isLoading: fetchingQs,
  //   error: qFetchError,
  //   isSuccess: qsFetchedSucess,
  // } = useGetAssessmentQuestionnaireQuery(selectedAssessment?.id, {
  //   skip: !selectedAssessment,
  // });

  // const {
  //   data: subResponses,
  //   error: subResError,
  //   isLoading: fetchingSubRes,
  //   isSuccess: resFetchedsuccess,
  // } = useGetSubmittedResponsesQuery(
  //   { submissionId: selectedSubmissionId },
  //   { skip: !selectedSubmissionId }
  // );

  const [
    getAssQs,
    {
      data: questionnaire,
      isFetching: fetchingQs,
      error: qFetchError,
      isSuccess: qsFetchedSucess,
    },
  ] = useLazyGetAssessmentQuestionnaireQuery();

  const [
    getSubResponses,
    {
      data: subResponses,
      error: subResError,
      isFetching: fetchingSubRes,
      isSuccess: resFetchedsuccess,
    },
  ] = useLazyGetSubmittedResponsesQuery();

  const [openSubResForm, setOpenSubResForm] = useState(false);

  const columns = useMemo(
    () => [
      colHelper.accessor((row) => row.submitted_user, {
        id: "submitted_user",
        header: "Submitted By",
        cell: (info) => {
          const user = info.getValue();
          return (
            <div className="flex flex-col">
              <span className="font-medium">{`${user?.first_name} ${user?.last_name}`}</span>
              <span className="text-xs text-gray-500">{user?.email}</span>
            </div>
          );
        },
      }),

      colHelper.accessor((row) => row.assessment, {
        id: "assessment_type",
        header: "Assessment Type",
        cell: (info) => (
          <div className="capitalize">{info.getValue().assessment_type}</div>
        ),
      }),

      colHelper.accessor((row) => row.created_at, {
        id: "submitted_at",
        header: "Submitted At",
        cell: (info) => (
          <div className="font-medium">
            {new Date(info.getValue()).toLocaleString()}
          </div>
        ),
      }),
      colHelper.accessor((row) => row.status, {
        id: "status",
        header: "Status",
        cell: (info) => (
          <div
            className={`px-2 py-1 rounded ${
              info.getValue() === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : info.getValue() === "approved"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {info.getValue()}
          </div>
        ),
      }),
      colHelper.accessor(
        (row) => (row.assessed_by ? row.assessed_by : "Not Assessed"),
        {
          id: "assessed_by",
          header: "Assessed By",
          cell: (info) => (
            <div className="font-medium">
              {info.getValue()?.username ?? info.getValue()}
            </div>
          ),
        }
      ),
      colHelper.accessor((row) => (row.assessed_by ? row.updated_at : null), {
        id: "assessed_at",
        header: "Assessed At",
        cell: (info) =>
          info.getValue() ? (
            <span>{new Date(info.getValue()).toLocaleString()}</span>
          ) : (
            <span className="text-gray-400 italic">Not Yet Assessed</span>
          ),
      }),
      colHelper.display({
        id: "show_assessment",
        header: "Show Assessment",
        cell: ({ row }) => (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => {
                  getSubResponses({ submissionId: row.original.id });
                  getAssQs(row.original.assessment?.id);
                }}
              >
                Open Submission
              </Button>
            </DialogTrigger>
            <DialogContent className="mb-8 flex h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0 p-0">
              <ScrollArea className="flex flex-col justify-between overflow-hidden">
                <DialogHeader className="contents space-y-0 text-left">
                  <DialogTitle className="px-6 pt-6">
                    Product Information
                  </DialogTitle>
                </DialogHeader>

                <DialogDescription asChild>
                  {fetchingQs ? (
                    <p>Loading Qs</p>
                  ) : fetchingSubRes ? (
                    <p>Loading Res...</p>
                  ) : (
                    <PreAssessmentForm
                      assessment={row.original.assessment}
                      questionnaire={questionnaire}
                      subResponses={subResponses}
                      submissionId={row.original.id}
                    />
                  )}
                </DialogDescription>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        ),
      }),
    ],
    [qsFetchedSucess, resFetchedsuccess]
  );

  const table = useReactTable({
    data: subAssessments ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PreAssessmentSubmissions;
