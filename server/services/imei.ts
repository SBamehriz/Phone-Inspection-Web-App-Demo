interface PhoneSpecs {
  brand: string;
  model: string;
  storage?: string;
  color?: string;
  releaseYear?: string;
}

// ---------------------------------------------------------------------------
// Mock IMEI Lookup — returns realistic phone specifications
// In production, this would call an external IMEI verification API.
// For the demo, we derive specs from common IMEI prefixes (TAC codes).
// ---------------------------------------------------------------------------

const phoneCatalog: Array<{
  prefix: string;
  brand: string;
  models: Array<{ model: string; storage: string; color: string; year: string }>;
}> = [
  {
    prefix: "35345678",
    brand: "Apple",
    models: [
      { model: "iPhone 15 Pro Max", storage: "256 GB", color: "Natural Titanium", year: "2023" },
      { model: "iPhone 15", storage: "128 GB", color: "Blue", year: "2023" },
      { model: "iPhone 14 Pro", storage: "256 GB", color: "Deep Purple", year: "2022" },
      { model: "iPhone 13", storage: "128 GB", color: "Midnight", year: "2021" },
      { model: "iPhone 12", storage: "64 GB", color: "Green", year: "2020" },
    ],
  },
  {
    prefix: "35487654",
    brand: "Samsung",
    models: [
      { model: "Galaxy S24 Ultra", storage: "256 GB", color: "Titanium Gray", year: "2024" },
      { model: "Galaxy S23", storage: "128 GB", color: "Phantom Black", year: "2023" },
      { model: "Galaxy A54", storage: "128 GB", color: "Awesome Violet", year: "2023" },
      { model: "Galaxy Z Fold 5", storage: "512 GB", color: "Icy Blue", year: "2023" },
      { model: "Galaxy S22 Ultra", storage: "256 GB", color: "Burgundy", year: "2022" },
    ],
  },
  {
    prefix: "86123456",
    brand: "OnePlus",
    models: [
      { model: "12", storage: "256 GB", color: "Flowy Emerald", year: "2024" },
      { model: "11 5G", storage: "256 GB", color: "Titan Black", year: "2023" },
      { model: "Nord CE 3", storage: "128 GB", color: "Aqua Surge", year: "2023" },
    ],
  },
  {
    prefix: "86987654",
    brand: "Xiaomi",
    models: [
      { model: "14 Pro", storage: "256 GB", color: "Black", year: "2024" },
      { model: "13 Pro", storage: "256 GB", color: "Ceramic Black", year: "2023" },
      { model: "Redmi Note 13 Pro", storage: "128 GB", color: "Midnight Black", year: "2024" },
    ],
  },
  {
    prefix: "35090078",
    brand: "Google",
    models: [
      { model: "Pixel 8 Pro", storage: "128 GB", color: "Bay", year: "2023" },
      { model: "Pixel 7a", storage: "128 GB", color: "Charcoal", year: "2023" },
      { model: "Pixel 8", storage: "128 GB", color: "Obsidian", year: "2023" },
    ],
  },
];

// Fallback catalog for unknown prefixes
const fallbackPhones: Array<{ brand: string; model: string; storage: string; color: string; year: string }> = [
  { brand: "Apple", model: "iPhone 14", storage: "128 GB", color: "Midnight", year: "2022" },
  { brand: "Samsung", model: "Galaxy S23", storage: "128 GB", color: "Phantom Black", year: "2023" },
  { brand: "Google", model: "Pixel 8", storage: "128 GB", color: "Obsidian", year: "2023" },
  { brand: "OnePlus", model: "11 5G", storage: "256 GB", color: "Titan Black", year: "2023" },
  { brand: "Xiaomi", model: "13 Pro", storage: "256 GB", color: "Ceramic Black", year: "2023" },
  { brand: "Samsung", model: "Galaxy A54", storage: "128 GB", color: "Awesome Lime", year: "2023" },
  { brand: "Apple", model: "iPhone 13 Pro", storage: "256 GB", color: "Sierra Blue", year: "2021" },
  { brand: "Google", model: "Pixel 7 Pro", storage: "256 GB", color: "Snow", year: "2022" },
];

export async function lookupIMEI(imei: string): Promise<PhoneSpecs> {
  // Validate IMEI format (must be 15 digits)
  if (!/^\d{15}$/.test(imei)) {
    throw new Error("Invalid IMEI format. Must be exactly 15 digits.");
  }

  // Simulate network delay for realism
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 400));

  // Try to match a known prefix
  for (const entry of phoneCatalog) {
    if (imei.startsWith(entry.prefix)) {
      // Deterministically pick a model based on remaining digits
      const idx = parseInt(imei.slice(-2), 10) % entry.models.length;
      const phone = entry.models[idx];
      return {
        brand: entry.brand,
        model: phone.model,
        storage: phone.storage,
        color: phone.color,
        releaseYear: phone.year,
      };
    }
  }

  // Fallback: deterministically pick from the general catalog
  const idx = parseInt(imei.slice(-3), 10) % fallbackPhones.length;
  const phone = fallbackPhones[idx];
  return {
    brand: phone.brand,
    model: phone.model,
    storage: phone.storage,
    color: phone.color,
    releaseYear: phone.year,
  };
}
