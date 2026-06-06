export const ACCESSORY_CATEGORIES = [
  'Lowrider Adapters',
  'Lowrider Knock Offs',
  'Lowrider Tools',
] as const;

export type AccessoryCategory = (typeof ACCESSORY_CATEGORIES)[number];

export const SPECIFICATION_FIELDS = [
  { key: 'brand', label: 'Brand' },
  { key: 'boltPattern', label: 'Bolt Pattern (PCD)' },
  { key: 'innerBoltPattern', label: 'Inner Bolt Pattern' },
  { key: 'outerBoltPattern', label: 'Outer Bolt Pattern' },
  { key: 'thickness', label: 'Thickness' },
  { key: 'lugCount', label: 'Lug Count' },
  { key: 'holeDesign', label: 'Hole Design' },
  { key: 'fitmentType', label: 'Fitment Type' },
  { key: 'material', label: 'Material' },
  { key: 'construction', label: 'Construction' },
  { key: 'finish', label: 'Finish' },
  { key: 'colorCoding', label: 'Color Coding' },
  { key: 'sideOrientation', label: 'Side Orientation' },
  { key: 'vehicleCompatibility', label: 'Vehicle Compatibility' },
  { key: 'wireWheelBrandsCompatibility', label: 'Wire Wheel Brands Compatibility' },
  { key: 'warranty', label: 'Warranty' },
  { key: 'weight', label: 'Weight' },
  { key: 'shippingDimensions', label: 'Shipping Dimensions (LxWxH)' },
  { key: 'partNumber', label: 'Part Number / SKU' },
  { key: 'qty', label: 'Qty' },
] as const;
