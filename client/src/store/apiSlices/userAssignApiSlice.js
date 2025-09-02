import { apiSlice } from "./apiSlice";

const userAssignApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    assignUsers: builder.mutation({
      query: ({ payload, checklistId }) => ({
        url: `/checklists/${checklistId}/assignments`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (result, error, { checklistId }) => [
        { type: "Checklists", id: checklistId }, // specific checklist
        { type: "Checklists", id: "LIST" }, // or the full list
      ],
    }),
  }),
});

export const { useAssignUsersMutation } = userAssignApiSlice;
