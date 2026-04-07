// =============================================================
// Flexible Database Layer — TypeScript Types
// =============================================================

export type PropertyType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "date"
  | "checkbox"
  | "url"
  | "email"
  | "phone"
  | "relation";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  text: "Text",
  number: "Number",
  select: "Select",
  multi_select: "Multi-select",
  date: "Date",
  checkbox: "Checkbox",
  url: "URL",
  email: "Email",
  phone: "Phone",
  relation: "Relation",
};

export type SelectOptionColor =
  | "slate" | "red" | "orange" | "amber"
  | "green" | "teal" | "blue" | "violet" | "pink";

export const OPTION_COLORS: Record<SelectOptionColor, { bg: string; text: string }> = {
  slate:  { bg: "bg-slate-500/20",  text: "text-slate-300" },
  red:    { bg: "bg-red-500/20",    text: "text-red-300"   },
  orange: { bg: "bg-orange-500/20", text: "text-orange-300"},
  amber:  { bg: "bg-amber-500/20",  text: "text-amber-300" },
  green:  { bg: "bg-green-500/20",  text: "text-green-300" },
  teal:   { bg: "bg-teal-500/20",   text: "text-teal-300"  },
  blue:   { bg: "bg-blue-500/20",   text: "text-blue-300"  },
  violet: { bg: "bg-violet-500/20", text: "text-violet-300"},
  pink:   { bg: "bg-pink-500/20",   text: "text-pink-300"  },
};

export const COLOR_CYCLE: SelectOptionColor[] = [
  "blue", "green", "violet", "amber", "red", "teal", "pink", "orange", "slate",
];

export interface SelectOption {
  id: string;
  name: string;
  color: SelectOptionColor;
}

export interface PropertyConfig {
  options?: SelectOption[];          // select, multi_select
  targetDatabaseId?: string;         // relation
  targetDatabaseName?: string;       // relation
}

export interface DbProperty {
  id: string;
  database_id: string;
  name: string;
  type: PropertyType;
  config: PropertyConfig;
  position: number;
  is_primary: boolean;
  created_at: string;
}

// A record's cell value, keyed by property_id
export type CellValue = string | number | boolean | string[] | null;

export interface DbRecord {
  id: string;
  database_id: string;
  user_id: string;
  data: Record<string, CellValue>;
  position: number;
  created_at: string;
  updated_at: string;
}

export type ViewType = "table" | "kanban" | "calendar";

export interface SortConfig {
  propertyId: string;
  direction: "asc" | "desc";
}

export interface FilterConfig {
  propertyId: string;
  operator: "is" | "is_not" | "contains" | "is_empty";
  value: CellValue;
}

export interface ViewConfig {
  groupBy?: string;        // property_id (must be select type)
  datePropId?: string;     // property_id for calendar view date axis
  sortBy?: SortConfig[];
  filters?: FilterConfig[];
  hiddenProperties?: string[];
}

export interface DbView {
  id: string;
  database_id: string;
  name: string;
  type: ViewType;
  config: ViewConfig;
  is_default: boolean;
  created_at: string;
}

export interface UserDatabase {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  record_count?: number;
}

// API response shapes
export interface DatabasesResponse {
  databases: UserDatabase[];
}

export interface DatabaseDetailResponse {
  database: UserDatabase;
  properties: DbProperty[];
  records: DbRecord[];
  views: DbView[];
}
