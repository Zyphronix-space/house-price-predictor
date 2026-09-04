import { FEATURE_ORDER, FIELD_META } from './fields'

// House DB columns are snake_case (see backend/house_models.py); the ML
// pipeline's feature keys (used by /predict, fields.js) are PascalCase.
// This is the one place that maps between them on the frontend.
export const MODEL_TO_HOUSE_KEY = {
  MedInc: 'med_inc',
  HouseAge: 'house_age',
  AveRooms: 'ave_rooms',
  AveBedrms: 'ave_bedrms',
  Population: 'population',
  AveOccup: 'ave_occup',
  Latitude: 'latitude',
  Longitude: 'longitude',
}

export const HOUSE_KEY_TO_MODEL = Object.fromEntries(
  Object.entries(MODEL_TO_HOUSE_KEY).map(([modelKey, houseKey]) => [houseKey, modelKey])
)

export const HOUSE_FEATURE_FIELDS = FEATURE_ORDER.map((modelKey) => ({
  key: MODEL_TO_HOUSE_KEY[modelKey],
  modelKey,
  ...FIELD_META[modelKey],
}))

export function houseToModelFeatures(house) {
  return Object.fromEntries(
    HOUSE_FEATURE_FIELDS.map(({ key, modelKey }) => [modelKey, house[key]])
  )
}
