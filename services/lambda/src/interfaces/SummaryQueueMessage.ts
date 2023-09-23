import { SummaryType } from 'database';

export interface SummaryQueueMessage {
  uid: string;
  index: number;
  text: string;
  languageCode: string;
  summaryType: SummaryType;
  summaryUid: string;
  fileName: string;
}
