import { getCategoryColor, CategoryColor } from './category-color.util';

describe('getCategoryColor', () => {
  it('should return a color object with dot, bg, and text properties', () => {
    const color = getCategoryColor(1);
    expect(color.dot).toBeDefined();
    expect(color.bg).toBeDefined();
    expect(color.text).toBeDefined();
  });

  it('should return consistent results for the same ID', () => {
    const first = getCategoryColor(3);
    const second = getCategoryColor(3);
    expect(first).toEqual(second);
  });

  it('should return different colors for different IDs', () => {
    const color1 = getCategoryColor(1);
    const color2 = getCategoryColor(2);
    expect(color1).not.toEqual(color2);
  });

  it('should cycle through the palette for IDs beyond palette length', () => {
    const color0 = getCategoryColor(0);
    const color8 = getCategoryColor(8);
    expect(color0).toEqual(color8);
  });

  it('should handle ID of 0', () => {
    const color = getCategoryColor(0);
    expect(color.dot).toBe('#4caf50');
    expect(color.bg).toBe('#e8f5e9');
    expect(color.text).toBe('#2e7d32');
  });

  it('should handle negative IDs by using absolute value', () => {
    const colorPos = getCategoryColor(3);
    const colorNeg = getCategoryColor(-3);
    expect(colorPos).toEqual(colorNeg);
  });

  it('should return valid hex colors', () => {
    const hexRegex = /^#[0-9a-f]{6}$/i;
    for (let i = 0; i < 10; i++) {
      const color = getCategoryColor(i);
      expect(color.dot).toMatch(hexRegex);
      expect(color.bg).toMatch(hexRegex);
      expect(color.text).toMatch(hexRegex);
    }
  });
});
