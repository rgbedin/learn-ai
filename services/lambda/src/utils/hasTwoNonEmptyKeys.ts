export function hasTwoNonEmptyKeys(obj: Record<string, any>): boolean {
  // Check if the object has exactly two keys
  const keys = Object.keys(obj);
  if (keys.length !== 2) {
    return false;
  }

  // Check if none of the keys have empty values
  for (let key of keys) {
    if (!obj[key] || obj[key] === '') {
      return false;
    }
  }

  return true;
}
