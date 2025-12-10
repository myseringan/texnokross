import { uz } from './uz';
import { ru } from './ru';

export type Language = 'uz' | 'ru';

export type Translations = typeof uz;

export const translations: Record<Language, Translations> = {
  uz,
  ru,
};

export { uz, ru };
