import { useEffect, useState } from "react";
import { useGetDoctorQuery } from "../api/doctorApi";
import { useGetPatientQuery } from "../api/patientApi";
import { getUserInfo } from "../../service/auth.service";

export default function useAuthCheck() {
    const localAuth = getUserInfo();

    const role = localAuth?.role || "";
    const userId = localAuth?.userId || "";

    const isPatient = role === "patient";
    const isDoctor = role === "doctor";

    const { data: doctorData, isSuccess: dIsSuccess, isError: dIsError } =
        useGetDoctorQuery(userId, {
            skip: !userId || !isDoctor,
        });

    const { data: patientData, isSuccess: pIsSuccess, isError: pIsError } =
        useGetPatientQuery(userId, {
            skip: !userId || !isPatient,
        });

    const [data, setData] = useState({});
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        if (isPatient && pIsSuccess) {
            setData(patientData);
            setAuthChecked(true);
        } else if (isDoctor && dIsSuccess) {
            setData(doctorData);
            setAuthChecked(true);
        } else if (pIsError || dIsError) {
            setData({});
            setAuthChecked(true);
        } else if (!userId) {
            setData({});
            setAuthChecked(true);
        }
    }, [
        patientData,
        doctorData,
        pIsSuccess,
        dIsSuccess,
        pIsError,
        dIsError,
        isPatient,
        isDoctor,
        userId,
    ]);

    return {
        authChecked,
        data,
        role,
    };
}