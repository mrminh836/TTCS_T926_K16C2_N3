const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const recurringController = require('../controllers/recurringController');
const { validateMeetingMiddleware } = require('../validators/meetingValidator');
const { validateRecurringMiddleware } = require('../validators/recurringValidator');

// Recurring meetings route (phải đặt TRƯỚC /meetings để Express khớp đúng path)
router.post('/meetings/recurring', validateRecurringMiddleware, recurringController.createRecurringMeetings);

router.post('/meetings', validateMeetingMiddleware, meetingController.createMeeting);
router.get('/meetings', meetingController.getMeetings);
router.put('/meetings/:id', meetingController.updateMeeting);

module.exports = router;
