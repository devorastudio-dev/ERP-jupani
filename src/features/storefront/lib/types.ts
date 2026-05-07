export type ProductCustomization = {
  flavor?: string | null;
  size?: string | null;
  theme?: string | null;
  customMessage?: string | null;
  eventDate?: string | null;
  servingCount?: number | null;
  variantNotes?: string | null;
  selectedAddons?: string[] | null;
  answers?: Record<string, string | number | boolean | null> | null;
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  categories: string[];
  active: boolean;
  categoryId?: string | null;
  categoryIds?: string[];
  fulfillmentType: "sob_encomenda" | "pronta_entrega";
  unit: string;
  stockQuantity: number;
  estimatedServings?: number;
  estimatedKcalTotal?: number;
  estimatedKcalPerServing?: number;
  displayIngredients?: string | null;
  productLine?: string | null;
  orderMode?: string | null;
  minimumOrderQuantity?: number | null;
  minimumOrderUnit?: string | null;
  leadTimeHours?: number | null;
  acceptsFlavorSelection?: boolean;
  acceptsSizeSelection?: boolean;
  acceptsThemeCustomization?: boolean;
  acceptsCustomMessage?: boolean;
  acceptsEventDate?: boolean;
  acceptsServingCount?: boolean;
  acceptsVariantNotes?: boolean;
  requiresManualQuote?: boolean;
  orderGuidelines?: string | null;
  storefrontSectionTitle?: string | null;
  storefrontBadgeText?: string | null;
  isHealthy?: boolean;
  isLactoseFree?: boolean;
  isGlutenFree?: boolean;
  notes?: string | null;
  availableForOrder: boolean;
};

export type StorefrontCategory = {
  id: string;
  name: string;
};

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  itemNotes?: string | null;
  customization?: ProductCustomization | null;
};

export type Cart = {
  items: CartItem[];
  notes?: string;
  updatedAt: string;
};
