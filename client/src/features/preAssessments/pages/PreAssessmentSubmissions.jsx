import {
  useLazyGetAssessmentQuestionnaireQuery,
  useLazyGetSubmittedResponsesQuery,
} from "@/features/preAssessments/store/preAssessmentApiSlice";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
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
import { ChevronLeftIcon, SearchIcon } from "lucide-react";

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
import { usePreAssessment } from "../hooks/usePreAssessment";
import PreAssessSubmissionsPagination from "../components/PreAssessSubmissionsPagination";
import { Input } from "@/components/ui/input";

const PreAssessmentSubmissions = () => {
  const colHelper = createColumnHelper();
  const [preAssessSearch, setPreAssessSearch] = useState("");

  const { data: subAssessments } = usePreAssessment(preAssessSearch);

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

  const isToday = (createdAtDate) => {
    return (
      new Date(createdAtDate + "Z").toLocaleDateString() ===
      new Date().toLocaleDateString()
    );
  };

  const columns = useMemo(
    () => [
      colHelper.accessor((row) => row.id, {
        id: "submission_id",
        header: "Submission ID",
        cell: (info) => <div>{info.getValue()}</div>,
      }),

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
            {new Date(info.getValue() + "Z").toLocaleString()}
            {isToday(info.getValue()) && (
              <span className="text-xs border border-green-700 bg-green-50 text-green-700 rounded-lg px-2 ml-2">
                New
              </span>
            )}
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
            <span>{new Date(info.getValue() + "Z").toLocaleString()}</span>
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
            <DialogContent className=" mb-8 flex flex-col gap-0 p-0 h-[calc(100vh-2rem)] max-w-[90vw] w-full dialoggasdf">
              <DialogHeader className="contents space-y-0 text-left">
                <DialogTitle className="px-6 pt-6">
                  {`Pre-Assessment Submission for ${row.original.assessment?.assessment_type} By ${row.original.submitted_user?.username}`}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1 flex flex-col overflow-hidden">
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
    data: subAssessments?.submissions ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="flex flex-col flex-1 h-[87vh] border-none shadow-none">
      <CardHeader className="bg-muted py-1 flex flex-row items-center justify-between">
        <CardTitle>Submissions</CardTitle>
        <div className="flex gap-2">
          <div className="relative max-w-70 min-w-40">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-primary h-4 w-4" />
            <Input
              type="text"
              name="email_or_username"
              value={preAssessSearch}
              onChange={(e) => setPreAssessSearch(e.target.value)}
              placeholder={`Search app by ${"submission id"}`}
              className="w-full pl-10 pr-3 py-2 border"
            />
          </div>
          <div></div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto border rounded-md">
        <ScrollArea className="h-full overflow-auto">
          <Table className="h-full">
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
                  <TableRow
                    key={row.id}
                    className={
                      isToday(row.original.created_at)
                        ? "dark:bg-green-200/20 bg-green-200/30"
                        : ""
                    }
                  >
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
                <TableRow>No contents Available</TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <PreAssessSubmissionsPagination />
      </CardFooter>
    </Card>
  );
};

export default PreAssessmentSubmissions;
