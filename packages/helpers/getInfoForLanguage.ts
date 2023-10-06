import Languages from './assets/languages.json';

export function getInfoForLanguage(languageCode: string, locale?: string) {
  const languageData = Languages.languages.find((l) => l.code === languageCode);
  const localeLowerCase = locale?.toLocaleLowerCase();
  if (localeLowerCase && languageData && localeLowerCase in languageData.localized) {
    languageData.language = (languageData.localized as any)[localeLowerCase];
  }
  return languageData;
}
