// integrations/google.js
// Google Maps/Places API integration using axios and environment variables
import axios from "axios";
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Geocode an address to get latitude and longitude
export const geocodeAddress = async (address) => {
  if (!address) {
    throw new Error("Address is required for geocoding");
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await axios.get(url);

  if (res.data.status === "OK" && res.data.results.length > 0) {
    const location = res.data.results[0].geometry.location;
    return {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: res.data.results[0].formatted_address,
    };
  }

  if (res.data.status === "ZERO_RESULTS") {
    return null;
  }

  // Include error_message from Google if available
  const errorMsg = res.data.error_message
    ? `${res.data.status}: ${res.data.error_message}`
    : res.data.status;
  throw new Error(`Geocoding failed: ${errorMsg}`);
};

// Get place details by place_id
export const getPlaceDetails = async (placeId) => {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await axios.get(url);
  return res.data;
};

// Search for places (e.g., restaurants) by text query
export const searchPlaces = async (query) => {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await axios.get(url);
  return res.data;
};

// Get static map image URL
export const getStaticMapUrl = (center, zoom = 15, size = "600x300") => {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(center)}&zoom=${zoom}&size=${size}&key=${GOOGLE_MAPS_API_KEY}`;
};
