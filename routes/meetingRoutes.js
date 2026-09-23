const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');

router.post('/meetings', meetingController.createMeeting);

module.exports = router;