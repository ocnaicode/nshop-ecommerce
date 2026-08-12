import { calculateDistance, slugify, generateOrderNumber, validateBangladeshPhone, normalizeBangladeshPhone, formatCurrency } from '@/lib/utils';

describe('Utils', () => {
  test('calculateDistance returns correct km', () => {
    const dist = calculateDistance(23.8103, 90.4125, 23.7925, 90.4078);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(10);
  });

  test('slugify converts text to slug', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
    expect(slugify('Fresh Rice 5kg')).toBe('fresh-rice-5kg');
  });

  test('generateOrderNumber creates unique order numbers', () => {
    const n1 = generateOrderNumber();
    const n2 = generateOrderNumber();
    expect(n1).not.toBe(n2);
    expect(n1.startsWith('ORD-')).toBe(true);
  });

  test('validateBangladeshPhone validates correctly', () => {
    expect(validateBangladeshPhone('01712345678')).toBe(true);
    expect(validateBangladeshPhone('+8801712345678')).toBe(true);
    expect(validateBangladeshPhone('01234567890')).toBe(false);
    expect(validateBangladeshPhone('12345')).toBe(false);
  });

  test('normalizeBangladeshPhone normalizes correctly', () => {
    expect(normalizeBangladeshPhone('01712345678')).toBe('+8801712345678');
    expect(normalizeBangladeshPhone('+8801712345678')).toBe('+8801712345678');
  });

  test('formatCurrency formats BDT correctly', () => {
    expect(formatCurrency(1000)).toBe('৳1,000');
    expect(formatCurrency(50.5)).toBe('৳50.5');
  });
});
