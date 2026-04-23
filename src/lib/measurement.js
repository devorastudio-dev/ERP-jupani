const aliases = {
  quilograma: "kg",
  quilo: "kg",
  quilos: "kg",
  kilo: "kg",
  kilos: "kg",
  grama: "g",
  gramas: "g",
  litro: "l",
  litros: "l",
  mililitro: "ml",
  mililitros: "ml",
  unidade: "un",
  unidades: "un",
  und: "un",
  dz: "duzia",
  dúzia: "duzia",
  duzia: "duzia",
};

const factors = {
  mg: { group: "weight", factor: 0.001 },
  g: { group: "weight", factor: 1 },
  kg: { group: "weight", factor: 1000 },
  ml: { group: "volume", factor: 1 },
  l: { group: "volume", factor: 1000 },
  un: { group: "count", factor: 1 },
  duzia: { group: "count", factor: 12 },
};

export function normalizeUnit(unit) {
  const normalized = String(unit ?? "")
    .trim()
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll(" ", "");
  return aliases[normalized] ?? normalized;
}

export function getUnitMeta(unit) {
  return factors[normalizeUnit(unit)] ?? null;
}

export function areUnitsCompatible(fromUnit, toUnit) {
  const fromMeta = getUnitMeta(fromUnit);
  const toMeta = getUnitMeta(toUnit);
  return Boolean(fromMeta && toMeta && fromMeta.group === toMeta.group);
}

export function convertQuantity(quantity, fromUnit, toUnit) {
  const fromMeta = getUnitMeta(fromUnit);
  const toMeta = getUnitMeta(toUnit);
  if (!fromMeta || !toMeta || fromMeta.group !== toMeta.group) {
    return null;
  }

  const baseValue = Number(quantity ?? 0) * fromMeta.factor;
  return baseValue / toMeta.factor;
}

export function convertUnitCost(unitCost, fromUnit, toUnit) {
  const convertedQuantity = convertQuantity(1, fromUnit, toUnit);
  if (!convertedQuantity || convertedQuantity <= 0) {
    return null;
  }

  return Number(unitCost ?? 0) / convertedQuantity;
}

export function getCompatibleUnits(unit) {
  const meta = getUnitMeta(unit);
  if (!meta) return [normalizeUnit(unit)];

  return Object.entries(factors)
    .filter(([, value]) => value.group === meta.group)
    .map(([key]) => key);
}
