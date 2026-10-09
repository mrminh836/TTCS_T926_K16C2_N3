const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const recurringController = require('../controllers/recurringController');
const participantController = require('../controllers/participantController');
const { validateMeetingMiddleware } = require('../validators/meetingValidator');
const { validateRecurringMiddleware } = require('../validators/recurringValidator');

// 1. Recurring meetings route (phải đặt TRƯỚC /meetings để Express khớp đúng path)
router.post('/meetings/recurring', validateRecurringMiddleware, recurringController.createRecurringMeetings);

// 2. Meeting Participants & Response Status routes
router.get('/meetings/:id/participants', participantController.getParticipants);
router.patch('/meetings/:id/participants/:userId/status', participantController.updateResponseStatus);
router.put('/meetings/:id/participants/:userId/status', participantController.updateResponseStatus);
router.post('/meetings/:id/participants', participantController.addParticipants);
router.delete('/meetings/:id/participants/:userId', participantController.removeParticipant);

// 3. Meeting CRUD routes
router.post('/meetings', validateMeetingMiddleware, meetingController.createMeeting);
router.get('/meetings', meetingController.getMeetings);
router.get('/meetings/:id', meetingController.getMeetingById);
router.put('/meetings/:id', meetingController.updateMeeting);

module.exports = router;
