import express from 'express';
import { createServiceRequest, createRecruitmentApplication, createCommunityRegistration, createContactMessage } from '../controllers/formController.js';

const router = express.Router();

router.post('/services/:id/requests', createServiceRequest);
router.post('/recruitment/applications', createRecruitmentApplication);
router.post('/recruitment', createRecruitmentApplication);
router.post('/applications', createRecruitmentApplication);
router.post('/community/register', createCommunityRegistration);
router.post('/contact', createContactMessage);

export default router;

