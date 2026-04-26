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
};

export type Cart = {
  items: CartItem[];
  notes?: string;
  updatedAt: string;
};
