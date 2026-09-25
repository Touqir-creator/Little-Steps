const Provider = require('../models/Provider');

// CREATE provider profile
exports.createProvider = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can create a provider profile' });
    }

    const existing = await Provider.findOne({ user: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'Provider profile already exists for this user' });
    }

    const { type, businessName, bio, experienceYears, hourlyRate, location, city, availability, lat, lon } = req.body;

    if (!city || !lat || !lon) {
      return res.status(400).json({ message: 'City and location coordinates are required' });
    }

    const provider = new Provider({
      user: req.user.id,
      type,
      businessName,
      bio,
      experienceYears,
      hourlyRate,
      location,
      city,
      coordinates: {
        type: 'Point',
        coordinates: [lon, lat] // GeoJSON order: [longitude, latitude]
      },
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
    const { type, city, lat, lng, near, radius } = req.query;

    let filter = {};
    if (type) filter.type = type;

    // Case 1: browser sent real coordinates (e.g. from navigator.geolocation)
    let searchLat = lat ? parseFloat(lat) : null;
    let searchLon = lng ? parseFloat(lng) : null;

    // Case 2: user typed a place name instead — geocode it
    if (!searchLat && near) {
      const coords = await geocodeAddress(near, '');
      searchLat = coords.lat;
      searchLon = coords.lon;
    }

    // If we have coordinates from either case, do a real distance search
    if (searchLat && searchLon) {
      const maxDistanceKm = radius ? parseFloat(radius) : 25; // default 25km radius
      filter.coordinates = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [searchLon, searchLat]
          },
          $maxDistance: maxDistanceKm * 1000 // MongoDB expects meters
        }
      };
    } else if (city) {
      // fallback: simple city name filter if no coordinates given
      filter.city = { $regex: city, $options: 'i' };
    }

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
