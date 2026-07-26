const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

// CREATE booking request (parent only)
exports.createBooking = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can create booking requests' });
    }

    const { providerId, date, startTime, endTime, notes } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const booking = new Booking({
      parent: req.user.id,
      provider: providerId,
      date,
      startTime,
      endTime,
      notes
    });

    await booking.save();

    res.status(201).json({ message: 'Booking request created', booking });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET "My Bookings" for a parent
exports.getMyBookings = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can view their bookings here' });
    }

    const bookings = await Booking.find({ parent: req.user.id })
      .populate({
        path: 'provider',
        select: 'businessName type location hourlyRate'
      })
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET "Requests Received" for a provider
exports.getReceivedBookings = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can view received bookings' });
    }

    const providerProfile = await Provider.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found for this user' });
    }

    const bookings = await Booking.find({ provider: providerProfile._id })
      .populate({
        path: 'parent',
        select: 'name email'
      })
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// UPDATE booking status (accept / reject / complete / cancel)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['accepted', 'rejected', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const booking = await Booking.findById(req.params.id).populate('provider');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (status === 'accepted' || status === 'rejected' || status === 'completed') {
      const providerProfile = await Provider.findOne({ user: req.user.id });
      if (!providerProfile || booking.provider._id.toString() !== providerProfile._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this booking' });
      }
    }

    if (status === 'cancelled') {
      if (booking.parent.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to cancel this booking' });
      }
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({ message: `Booking ${status}`, booking });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};