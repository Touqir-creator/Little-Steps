// server/utils/geocode.js

async function geocodeAddress(location, city) {
  const query = encodeURIComponent(`${location}, ${city}, India`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'LittleSteps-ChildcareApp/1.0'
    }
  });

  const data = await response.json();

  if (!data || data.length === 0) {
    throw new Error('Could not find coordinates for this location');
  }

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };
}

module.exports = geocodeAddress;
