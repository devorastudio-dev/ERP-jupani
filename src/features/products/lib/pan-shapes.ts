export type PanShapePreset = {
  code: string;
  label: string;
  minSlices: number;
  maxSlices: number;
};

export const PAN_SHAPE_PRESETS: PanShapePreset[] = [
  { code: "redonda_com_furo_18", label: "Redonda com furo - 18 cm", minSlices: 12, maxSlices: 16 },
  { code: "redonda_com_furo_22", label: "Redonda com furo - 22 cm", minSlices: 18, maxSlices: 22 },
  { code: "redonda_com_furo_24", label: "Redonda com furo - 24 cm", minSlices: 22, maxSlices: 26 },
  { code: "redonda_reta_15", label: "Redonda reta - 15 cm", minSlices: 10, maxSlices: 14 },
  { code: "redonda_reta_20", label: "Redonda reta - 20 cm", minSlices: 18, maxSlices: 24 },
  { code: "redonda_reta_25", label: "Redonda reta - 25 cm", minSlices: 26, maxSlices: 34 },
  { code: "retangular_pequena", label: "Retangular pequena", minSlices: 12, maxSlices: 18 },
  { code: "retangular_media", label: "Retangular média", minSlices: 20, maxSlices: 30 },
  { code: "retangular_grande", label: "Retangular grande", minSlices: 30, maxSlices: 45 },
  { code: "forma_pudim_22", label: "Forma pudim - 22 cm", minSlices: 14, maxSlices: 18 },
];

export const getPanShapePreset = (code?: string | null) =>
  PAN_SHAPE_PRESETS.find((preset) => preset.code === code) ?? null;

export const getAverageSlicesByPanShape = (code?: string | null) => {
  const preset = getPanShapePreset(code);
  if (!preset) return 0;
  return (preset.minSlices + preset.maxSlices) / 2;
};
