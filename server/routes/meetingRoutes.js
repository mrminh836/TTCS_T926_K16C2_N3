const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { validateMeetingMiddleware } = require('../validators/meetingValidator');

router.post('/meetings', validateMeetingMiddleware, meetingController.createMeeting);

module.exports = router;