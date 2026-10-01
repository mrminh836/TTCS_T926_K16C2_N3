const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { validateMeetingMiddleware } = require('../validators/meetingValidator');

router.post('/meetings', validateMeetingMiddleware, meetingController.createMeeting);
router.get('/meetings', meetingController.getMeetings);

module.exports = router;