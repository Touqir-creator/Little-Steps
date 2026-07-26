const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  createBooking,
  getMyBookings,
  getReceivedBookings,
  updateBookingStatus
} = require('../controllers/bookingController');

router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/received', protect, getReceivedBookings);
router.put('/:id/status', protect, updateBookingStatus);

module.exports = router;