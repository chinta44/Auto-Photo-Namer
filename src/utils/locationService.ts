import { LocationData } from '../types';

export async function getCurrentLocationData(): Promise<LocationData | null> {
  if (!('geolocation' in navigator)) {
    console.warn('Geolocation is not supported by this browser.');
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        let address = '';
        let placeName = '';

        try {
          // OpenStreetMap Nominatim reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'ja,en',
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.address) {
              const addr = data.address;
              // Extract restaurant, amenity, shop, or building name if available
              placeName =
                addr.restaurant ||
                addr.cafe ||
                addr.fast_food ||
                addr.pub ||
                addr.bar ||
                addr.amenity ||
                addr.shop ||
                addr.building ||
                data.name ||
                '';

              const city = addr.city || addr.town || addr.ward || addr.suburb || '';
              const road = addr.road || '';
              address = [city, road].filter(Boolean).join(' ');
            }
          }
        } catch (err) {
          console.warn('Reverse geocoding fetch failed:', err);
        }

        resolve({
          latitude: lat,
          longitude: lon,
          address: address || undefined,
          placeName: placeName || undefined,
        });
      },
      (error) => {
        console.warn('Geolocation permission error or timeout:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  });
}
