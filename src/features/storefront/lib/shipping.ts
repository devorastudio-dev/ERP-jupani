import { ATELIER_ADDRESS } from "@/features/storefront/lib/contact";

export type ShippingMethod = "DELIVERY" | "PICKUP";

export type ShippingFeeBreakdown = {
  fee: number;
  label: string;
  description: string;
};

export const SHIPPING_METHODS: {
  id: ShippingMethod;
  label: string;
  description: string;
}[] = [
  {
    id: "DELIVERY",
    label: "Entrega",
    description: "Taxa leve conforme a regiao do endereco em Piracema.",
  },
  {
    id: "PICKUP",
    label: "Retirar no ateliê",
    description: "Sem taxa de entrega.",
  },
];

const BASE_DELIVERY_FEE = 4;
const EXTENDED_AREA_FEE = 6;

const EXTENDED_AREA_KEYWORDS = [
  "zona rural",
  "area rural",
  "chacara",
  "chacaras",
  "sitio",
  "fazenda",
  "povoado",
  "comunidade",
  "afastado",
];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export const getShippingBreakdown = ({
  city,
  district,
  method,
}: {
  city: string;
  district: string;
  method: ShippingMethod;
}): ShippingFeeBreakdown => {
  if (method === "PICKUP") {
    return {
      fee: 0,
      label: "Retirada no ateliê",
      description: "Sem taxa de entrega.",
    };
  }

  const normalizedCity = normalize(city);
  const normalizedDistrict = normalize(district);
  const atelierCity = normalize(ATELIER_ADDRESS.city);
  const isExtendedArea = EXTENDED_AREA_KEYWORDS.some((keyword) =>
    normalizedDistrict.includes(normalize(keyword))
  );

  if (!normalizedCity || normalizedCity === atelierCity) {
    if (isExtendedArea) {
      return {
        fee: EXTENDED_AREA_FEE,
        label: "Entrega em area mais afastada",
        description: "Taxa um pouco maior para zona rural e enderecos mais afastados.",
      };
    }

    return {
      fee: BASE_DELIVERY_FEE,
      label: `Entrega em ${ATELIER_ADDRESS.city}`,
      description: "Taxa base para entregas urbanas em Piracema.",
    };
  }

  return {
    fee: 0,
    label: "Entrega indisponivel fora de Piracema",
    description: "No momento, atendemos apenas enderecos em Piracema.",
  };
};

export const calculateShipping = (params: {
  city: string;
  district: string;
  method: ShippingMethod;
}) => getShippingBreakdown(params).fee;

export const supportsDelivery = ({
  city,
  method,
}: {
  city: string;
  method: ShippingMethod;
}) => {
  if (method === "PICKUP") {
    return true;
  }

  const normalizedCity = normalize(city);
  const atelierCity = normalize(ATELIER_ADDRESS.city);

  return !normalizedCity || normalizedCity === atelierCity;
};
