function escapeKey(key: string): string {
  let result = '';
  for (let i = 0; i < key.length; i++) {
    if (key[i] === '"' && (i === 0 || key[i - 1] !== '\\')) {
      result += '\\"';
    } else {
      result += key[i];
    }
  }
  return result;
}

function fixIncompleteJSON(jsonStr: string): string {
  let depth = 0;
  let isInString = false;
  let lastChar = '';

  for (let char of jsonStr) {
    if (char === '"' && lastChar !== '\\') {
      isInString = !isInString;
    }
    if (!isInString) {
      if (char === '{' || char === '[') {
        depth++;
      } else if (char === '}' || char === ']') {
        depth--;
      }
    }
    lastChar = char;
  }

  while (depth > 0) {
    jsonStr += '}';
    depth--;
  }

  return jsonStr;
}

export function fixAndParseJSON(jsonStr: string): string {
  try {
    const parsed = JSON.parse(jsonStr);
    return JSON.stringify(parsed);
  } catch (err) {
    let tempStr = fixIncompleteJSON(jsonStr);

    try {
      const jsonData = JSON.parse(tempStr);

      const fixKeys = (obj: any): any => {
        const newObj: any = {};
        for (const key in obj) {
          let fixedKey = escapeKey(key);

          if (typeof obj[key] === 'object' && obj[key] !== null) {
            newObj[fixedKey] = fixKeys(obj[key]);
          } else {
            newObj[fixedKey] = obj[key];
          }
        }
        return newObj;
      };

      const fixed = fixKeys(jsonData);
      return JSON.stringify(fixed);
    } catch (err) {
      throw new Error('Failed to fix JSON');
    }
  }
}
