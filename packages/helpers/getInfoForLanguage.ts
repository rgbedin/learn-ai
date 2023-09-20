import Languages from './assets/languages.json';

export function getInfoForLanguage(languageCode: string) {
  const languageData = Languages.languages.find((l) => l.code === languageCode);
  return languageData;
}
