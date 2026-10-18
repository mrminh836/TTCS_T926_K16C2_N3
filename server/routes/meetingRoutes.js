const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const recurringController = require('../controllers/recurringController');
const participantController = require('../controllers/participantController');
const { validateMeetingMiddleware } = require('../validators/meetingValidator');
const { validateRecurringMiddleware } = require('../validators/recurringValidator');
const {
    verifyJWT,
    requireMeetingOwnerOrAdmin,
    requireSelfOrMeetingOwnerOrAdmin
} = require('../middleware/authMiddleware');

// 1. Recurring meetings route (phải đặt TRƯỚC /meetings để Express khớp đúng path) - Authenticated
router.post('/meetings/recurring', verifyJWT, validateRecurringMiddleware, recurringController.createRecurringMeetings);

// 2. Meeting Participants & Response Status routes
router.get('/meetings/:id/participants', verifyJWT, participantController.getParticipants);
router.patch('/meetings/:id/participants/:userId/status', verifyJWT, requireSelfOrMeetingOwnerOrAdmin, participantController.updateResponseStatus);
router.put('/meetings/:id/participants/:userId/status', verifyJWT, requireSelfOrMeetingOwnerOrAdmin, participantController.updateResponseStatus);
router.post('/meetings/:id/participants', verifyJWT, requireMeetingOwnerOrAdmin, participantController.addParticipants);
router.delete('/meetings/:id/participants/:userId', verifyJWT, requireMeetingOwnerOrAdmin, participantController.removeParticipant);

// 3. Meeting CRUD routes
router.post('/meetings', verifyJWT, validateMeetingMiddleware, meetingController.createMeeting);
router.get('/meetings', verifyJWT, meetingController.getMeetings);
router.get('/meetings/:id', verifyJWT, meetingController.getMeetingById);
router.put('/meetings/:id', verifyJWT, requireMeetingOwnerOrAdmin, meetingController.updateMeeting);

module.exports = router;
