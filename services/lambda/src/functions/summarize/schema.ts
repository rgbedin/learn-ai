export default {
  type: 'object',
  properties: {
    summaryUid: { type: 'string' },
    fileKey: { type: 'string' },
    languageCode: { type: 'string' },
    summaryType: { type: 'string' },
    pageStart: { type: 'number' },
    pageEnd: { type: 'number' },
    cost: { type: 'number' },
  },
  required: ['summaryUid', 'fileKey', 'languageCode', 'summaryType', 'pageStart', 'pageEnd', 'cost'],
} as const;
