import mongoose from "mongoose";
import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import { Prescription as PrescriptionModel } from "../../../shared/models";
import { Medicine } from "../../../shared/types";

const isId = (id: any) => typeof id === "string" && mongoose.isValidObjectId(id);

// Medicines are embedded in their prescription document.
const fields = (m: Medicine) => ({
    dosage: m.dosage,
    duration: m.duration,
    frequency: m.frequency,
    medicine: m.medicine,
});

const createMedicine = async (payload: Medicine[]): Promise<{ message: string }> => {
    if (!Array.isArray(payload)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Medicine list is required !!");
    }
    for (const item of payload) {
        const prescription = isId(item.prescriptionId) ? await PrescriptionModel.findById(item.prescriptionId) : null;
        if (!prescription) {
            throw new ApiError(httpStatus.NOT_FOUND, "Prescription is not found !!");
        }
        prescription.medicines.push(fields(item) as any);
        await prescription.save();
    }
    return { message: "Successfully medicine added" };
};

const updateMedicine = async (payload: Medicine): Promise<Medicine> => {
    const prescription = isId(payload.prescriptionId) ? await PrescriptionModel.findById(payload.prescriptionId) : null;
    if (!prescription) {
        throw new ApiError(httpStatus.NOT_FOUND, "Prescription is not found !!");
    }
    const medicine = prescription.medicines.id(payload.id);
    if (!medicine) {
        throw new ApiError(httpStatus.NOT_FOUND, "Medicine is not found !!");
    }
    medicine.set(fields(payload));
    await prescription.save();
    return medicine.toJSON();
};

const deleteMedicine = async (id: string): Promise<Medicine> => {
    const prescription = isId(id) ? await PrescriptionModel.findOne({ "medicines._id": id }) : null;
    const medicine = prescription?.medicines.id(id);
    if (!prescription || !medicine) {
        throw new ApiError(httpStatus.NOT_FOUND, "Medicine is not found !!");
    }
    const removed = medicine.toJSON();
    prescription.medicines.pull({ _id: id });
    await prescription.save();
    return removed;
};

export const MedicineService = {
    updateMedicine,
    createMedicine,
    deleteMedicine,
};
