'use strict';
const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const Controller = require('../controllers/Controller');

// Sensor data routes
router.get('/datasensor', asyncHandler(Controller.handleGetLatestSensorData));
// Device control and history routes
router.get('/actionhistory', asyncHandler(Controller.handleGetActionHistory));
// Display data
router.get('/display', asyncHandler(Controller.handleGetDisplayData));

module.exports = router;
