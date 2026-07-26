const Provider = require('../models/Provider');

// CREATE provider profile
exports.createProvider = async (req, res) => {
  try {
    // only users with role "provider" can create a provider profile
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can create a provider profile' });
    }

    // check if this user already has a provider profile
    const existing = await Provider.findOne({ user: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'Provider profile already exists for this user' });
    }

    const { type, businessName, bio, experienceYears, hourlyRate, location, availability } = req.body;

    const provider = new Provider({
      user: req.user.id,
      type,
      businessName,
      bio,
      experienceYears,
      hourlyRate,
      location,
      availability
    });

    await provider.save();

    res.status(201).json({ message: 'Provider profile created', provider });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET all providers (browse/search)
exports.getAllProviders = async (req, res) => {
  try {
    const { type, location } = req.query;

    let filter = {};
    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: 'i' };

    const providers = await Provider.find(filter).populate('user', 'name email');

    res.status(200).json(providers);

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET single provider by ID
exports.getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).populate('user', 'name email');

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.status(200).json(provider);

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// UPDATE provider profile
exports.updateProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // only the owner can update their own provider profile
    if (provider.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const updates = req.body;
    Object.assign(provider, updates);
    await provider.save();

    res.status(200).json({ message: 'Provider profile updated', provider });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE provider profile
exports.deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // only the owner can delete their own provider profile
    if (provider.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this profile' });
    }

    await provider.deleteOne();

    res.status(200).json({ message: 'Provider profile deleted' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};