import pdf from "pdf-parse";

export async function extractPdf(buffer: Buffer) {
  let currPage = 0;

  const thePdf = await pdf(buffer, {
    // From: https://gitlab.com/fwiwDev/pdf-extraction/-/blob/master/lib/pdf-extraction.js?ref_type=heads
    pagerender(pageData) {
      const renderOptions = {
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      };

      return pageData.getTextContent(renderOptions).then((textContent: any) => {
        currPage += 1;

        let lastY,
          text = "";

        for (const item of textContent.items) {
          if (lastY == item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += "\n" + item.str;
          }
          lastY = item.transform[5];
        }

        if (text) return `[[page ${currPage}]]\n${text}`;
        return text;
      });
    },
  });

  return { text: thePdf.text, numPages: currPage };
}
