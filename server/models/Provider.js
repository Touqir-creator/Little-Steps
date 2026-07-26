const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['individual', 'daycare_center'],
    required: true
  },
  businessName: {
    type: String, // used if type is daycare_center; can be same as name if individual
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  experienceYears: {
    type: Number,
    default: 0
  },
  hourlyRate: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  availability: {
    type: String, // simple text for now e.g. "Mon-Fri, 9am-6pm"
    default: ''
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Provider', providerSchema);