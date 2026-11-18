import express from 'express';
import { auth } from '../../middlewares/auth';
import { AuthUser } from '../../../enums';
import { AppointmentController } from './appointment.controller';

const router = express.Router();

// Admin-only endpoints: these expose or modify appointments across users.
router.get('/', auth(AuthUser.ADMIN), AppointmentController.getAllAppointment);

router.get('/patient/appointments', auth(AuthUser.PATIENT), AppointmentController.getPatientAppointmentById);
router.get('/patient/invoices', auth(AuthUser.PATIENT), AppointmentController.getPatientPaymentInfo);
router.get('/doctor/invoices', auth(AuthUser.DOCTOR), AppointmentController.getDoctorInvoices);

router.get('/doctor/appointments', auth(AuthUser.DOCTOR), AppointmentController.getDoctorAppointmentsById);
router.get('/doctor/patients', auth(AuthUser.DOCTOR), AppointmentController.getDoctorPatients);

router.get('/patient-payment-info/:id', auth(AuthUser.PATIENT, AuthUser.DOCTOR), AppointmentController.getPaymentInfoViaAppintmentId);

router.post('/tracking', AppointmentController.getAppointmentByTrackingId);
router.post('/create', AppointmentController.createAppointment);
router.post('/create-un-authenticate', AppointmentController.createAppointmentByUnAuthenticateUser);

// Keep the specific doctor route before /:id so Express does not treat
// "doctor" as an appointment ID.
router.patch('/doctor/update-appointment', auth(AuthUser.DOCTOR), AppointmentController.updateAppointmentByDoctor);

// Only admins may retrieve or delete an arbitrary appointment by ID.
router.get('/:id', auth(AuthUser.ADMIN), AppointmentController.getAppointment);
router.delete('/:id', auth(AuthUser.ADMIN), AppointmentController.deleteAppointment);

// Role-specific authorization is supplemented by ownership checks in the service layer.
router.patch('/:id', auth(AuthUser.ADMIN, AuthUser.DOCTOR, AuthUser.PATIENT), AppointmentController.updateAppointment);

export const AppointmentRouter = router;
