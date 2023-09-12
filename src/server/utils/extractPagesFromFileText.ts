export function extractPagesFromFileText(
  text: string,
  pageStart?: number,
  pageEnd?: number,
): string {
  // Check if the text doesn't have any [[page X]] headers. If not, return the entire text.
  if (!/\[\[page \d+\]\]/.test(text)) {
    return text;
  }

  // Split the text using the page headers as delimiters.
  // This regex captures content between [[page X]] headers. It also ensures capturing the last page.
  const pages = text.split(/\[\[page \d+\]\]\n?/).filter(Boolean);

  if (pageStart === undefined || pageEnd === undefined) {
    // If neither pageStart nor pageEnd is specified, return the concatenated pages.
    return pages.join("\n");
  } else {
    // Adjust the indices for zero-based array indexing
    pageStart -= 1;
    pageEnd -= 1;

    // Extract the relevant pages and concatenate them.
    return pages.slice(pageStart, pageEnd + 1).join("\n");
  }
}
