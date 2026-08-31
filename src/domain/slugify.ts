export const slugify = (text: string): string => {
  return text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
};