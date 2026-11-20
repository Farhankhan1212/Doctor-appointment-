import { tagTypes } from "../tag-types"
import { baseApi } from "./baseApi"

const DOC_URL = '/doctor'

export const doctorApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getDoctors: build.query({
            query: (arg) => ({
                url: `${DOC_URL}`,
                method: 'GET',
                params: arg
            }),
            transformResponse: (response) =>{
                return {
                    doctors: response.data,
                    meta: response.meta
                }
            },
            providesTags: [tagTypes.doctor]
        }),
        getAdminDoctors: build.query({
            query: (arg) => ({
                url: `${DOC_URL}/admin/list`,
                method: 'GET',
                params: arg
            }),
            transformResponse: (response) => {
                return {
                    doctors: response.data,
                    meta: response.meta
                }
            },
            providesTags: [tagTypes.doctor]
        }),
        setDoctorApproval: build.mutation({
            query: ({ id, approved }) => ({
                url: `${DOC_URL}/${id}/approval`,
                method: 'PATCH',
                data: { approved },
            }),
            invalidatesTags: [tagTypes.doctor]
        }),
        getDoctor: build.query({
            query: (id) => ({
                url: `${DOC_URL}/${id}`,
                method: 'GET',
            }),
            providesTags: [tagTypes.doctor]
        }),
        updateDoctor: build.mutation({
            query: ({ data, id }) => ({
                url: `${DOC_URL}/${id}`,
                method: 'PATCH',
                data: data,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }),
            invalidatesTags: [tagTypes.doctor]
        })
    })
})

export const {
    useGetDoctorsQuery,
    useGetDoctorQuery,
    useUpdateDoctorMutation,
    useGetAdminDoctorsQuery,
    useSetDoctorApprovalMutation
} = doctorApi