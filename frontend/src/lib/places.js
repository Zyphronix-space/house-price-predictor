// California cities and towns offered as starting points on /predict, with
// the approximate coordinates of each city centre. A place is only used to
// find the nearest real census block group in the model's dataset (see
// lib/neighbourhood.js); the coordinates never go to the model directly.
export const PLACES = [
  { name: 'Anaheim', lat: 33.84, lon: -117.91 },
  { name: 'Bakersfield', lat: 35.37, lon: -119.02 },
  { name: 'Berkeley', lat: 37.87, lon: -122.27 },
  { name: 'Chico', lat: 39.73, lon: -121.84 },
  { name: 'Chula Vista', lat: 32.64, lon: -117.08 },
  { name: 'Davis', lat: 38.54, lon: -121.74 },
  { name: 'Eureka', lat: 40.8, lon: -124.16 },
  { name: 'Fremont', lat: 37.55, lon: -121.99 },
  { name: 'Fresno', lat: 36.74, lon: -119.79 },
  { name: 'Glendale', lat: 34.14, lon: -118.26 },
  { name: 'Huntington Beach', lat: 33.66, lon: -118.0 },
  { name: 'Irvine', lat: 33.68, lon: -117.83 },
  { name: 'Long Beach', lat: 33.77, lon: -118.19 },
  { name: 'Los Angeles', lat: 34.05, lon: -118.24 },
  { name: 'Modesto', lat: 37.64, lon: -121.0 },
  { name: 'Monterey', lat: 36.6, lon: -121.89 },
  { name: 'Napa', lat: 38.3, lon: -122.29 },
  { name: 'Oakland', lat: 37.8, lon: -122.27 },
  { name: 'Oxnard', lat: 34.2, lon: -119.18 },
  { name: 'Palm Springs', lat: 33.83, lon: -116.55 },
  { name: 'Palo Alto', lat: 37.44, lon: -122.14 },
  { name: 'Pasadena', lat: 34.15, lon: -118.14 },
  { name: 'Redding', lat: 40.59, lon: -122.39 },
  { name: 'Riverside', lat: 33.95, lon: -117.4 },
  { name: 'Sacramento', lat: 38.58, lon: -121.49 },
  { name: 'Salinas', lat: 36.68, lon: -121.66 },
  { name: 'San Bernardino', lat: 34.11, lon: -117.29 },
  { name: 'San Diego', lat: 32.72, lon: -117.16 },
  { name: 'San Francisco', lat: 37.77, lon: -122.42 },
  { name: 'San Jose', lat: 37.34, lon: -121.89 },
  { name: 'San Luis Obispo', lat: 35.28, lon: -120.66 },
  { name: 'Santa Ana', lat: 33.75, lon: -117.87 },
  { name: 'Santa Barbara', lat: 34.42, lon: -119.7 },
  { name: 'Santa Cruz', lat: 36.97, lon: -122.03 },
  { name: 'Santa Monica', lat: 34.02, lon: -118.49 },
  { name: 'Santa Rosa', lat: 38.44, lon: -122.71 },
  { name: 'South Lake Tahoe', lat: 38.94, lon: -119.98 },
  { name: 'Stockton', lat: 37.96, lon: -121.29 },
  { name: 'Torrance', lat: 33.84, lon: -118.34 },
  { name: 'Ventura', lat: 34.27, lon: -119.23 },
  { name: 'Visalia', lat: 36.33, lon: -119.29 },
]

export function findPlace(name) {
  const q = name.trim().toLowerCase()
  return PLACES.find((p) => p.name.toLowerCase() === q) ?? null
}
