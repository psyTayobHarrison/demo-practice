export interface CategoryColor {
  dot: string;
  bg: string;
  text: string;
}

const PALETTE: CategoryColor[] = [
  { dot: '#4caf50', bg: '#e8f5e9', text: '#2e7d32' }, // Green
  { dot: '#1976d2', bg: '#e3f2fd', text: '#1565c0' }, // Blue
  { dot: '#e53935', bg: '#fbe9e7', text: '#c62828' }, // Red
  { dot: '#7b1fa2', bg: '#f3e5f5', text: '#6a1b9a' }, // Purple
  { dot: '#d81b60', bg: '#fce4ec', text: '#ad1457' }, // Pink
  { dot: '#ff8f00', bg: '#fff8e1', text: '#e65100' }, // Amber
  { dot: '#00897b', bg: '#e0f2f1', text: '#00695c' }, // Teal
  { dot: '#3949ab', bg: '#e8eaf6', text: '#283593' }, // Indigo
];

/**
 * Returns a deterministic color set for a category based on its ID.
 * Colors cycle through a fixed palette.
 */
export function getCategoryColor(categoryId: number): CategoryColor {
  const index = Math.abs(categoryId) % PALETTE.length;
  return PALETTE[index];
}
