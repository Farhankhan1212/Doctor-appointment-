import express, { NextFunction, Request, Response } from 'express';
import { DoctorController } from './doctor.controller';
import { AuthUser } from '../../../enums';
import { auth } from '../../middlewares/auth';
import { CloudinaryHelper } from '../../../helpers/uploadHelper';

const router = express.Router();

router.get('/', DoctorController.getAllDoctors);
// admin only: list every doctor (pending first) and approve / un-approve
router.get('/admin/list', auth(AuthUser.ADMIN), DoctorController.getAllDoctorsForAdmin);
router.patch('/:id/approval', auth(AuthUser.ADMIN), DoctorController.setApproval);
router.post('/', DoctorController.createDoctor);
router.get('/:id', DoctorController.getDoctor);
router.delete('/:id', auth(AuthUser.DOCTOR), DoctorController.deleteDoctor);
router.patch('/:id',
    CloudinaryHelper.upload.single('file'),
    auth(AuthUser.DOCTOR),
    (req: Request, res: Response, next: NextFunction) => {
        return DoctorController.updateDoctor(req, res, next);
    }
);

export const DoctorRouter = router;