type Charset = (null | undefined)[];

// Map all possible char code before @
const firstPartCharset: Charset = [];

firstPartCharset[33] = null;
for (let i = 35; i < 40; i++) firstPartCharset[i] = null;

firstPartCharset[42] = null;
firstPartCharset[43] = null;

for (let i = 45; i < 58; i++) firstPartCharset[i] = null;

firstPartCharset[61] = null;
firstPartCharset[63] = null;

for (let i = 65; i < 91; i++) firstPartCharset[i] = null;
for (let i = 94; i < 127; i++) firstPartCharset[i] = null;

// Map domain chars
const domainFirstCharset: Charset = [];

for (let i = 48; i < 58; i++) domainFirstCharset[i] = null;
for (let i = 65; i < 91; i++) domainFirstCharset[i] = null;
for (let i = 97; i < 123; i++) domainFirstCharset[i] = null;

const domainNextCharset: Charset = domainFirstCharset.with(45, null);

// See https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address for more info
// This implementation is based on the regular expression provided on the spec page:
// /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
export function isEmail(str: string): boolean {
  const strLen = str.length;
  // String cannot be empty
  if (strLen === 0) return false;

  // First char must be valid
  if (firstPartCharset[str.charCodeAt(0)] !== null) return false;

  const aIdx = str.indexOf('@', 1);
  // No @ found
  if (aIdx === -1) {
    for (let i = 1; i < strLen; ++i) {
      if (firstPartCharset[str.charCodeAt(i)] !== null)
        return false;
    }

    return true;
  }

  // Need to check the first part
  let i = 1;
  while (i < aIdx) {
    if (firstPartCharset[str.charCodeAt(i)] !== null)
      return false;

    ++i;
  }

  // Jump to after aIdx
  i = aIdx + 1;
  // First char after @ must be a char in domainFirstCharset
  if (i === strLen || domainFirstCharset[str.charCodeAt(i)] !== null) return false;

  i++;

  // Search for domain dots
  let dotIdx = str.indexOf('.', i);
  let matchCount: number;
  let code: number;

  // Continously iterating i to the dot position
  while (dotIdx !== -1) {
    // Dot cannot be at the end of the string
    if (dotIdx === strLen - 1)
      return false;

    // Skip this if i already reached dotIdx
    if (dotIdx !== i) {
      // Must reset this lol
      matchCount = 0;

      while (true) {
        code = str.charCodeAt(i);

        if (domainNextCharset[code] === null) {
          // Cannot match more than 61 times
          if (matchCount === 61) {
            // Must only match domainFirstCharset so
            // only check whether current char is not -
            // Must be the end of the part as well
            if (code === 45 || i !== dotIdx - 1) return false;

            // Move to the index after dot
            i += 2;
            break;
          }

          i++;
          if (i === dotIdx) {
            // The end must only match domainFirstCharset so
            // only check whether current char is not -
            if (code === 45) return false;

            // Skip the dot
            i++;
            break;
          }

          matchCount++;
        } else
          // Char cannot match domainFirstCharset if it
          // does not match domainNextCharset
          return false;
      }
    }

    // Redo the first char check for the next part
    // We don't need a length check here
    if (domainFirstCharset[str.charCodeAt(i)] !== null) return false;

    // Skip to the index after the checked char
    i++;
    dotIdx = str.indexOf('.', i);
  }

  // This happens when the first char check has already succeeded
  if (i === strLen) return true;

  // Check the part after last dot
  matchCount = 0;

  while (true) {
    code = str.charCodeAt(i);

    if (domainNextCharset[code] === null) {
      // Cannot match more than 61 times
      if (matchCount === 61)
        // Must only match domainFirstCharset so
        // only check whether current char is not -
        // Must be the end of the part as well
        return code !== 45 && i === strLen - 1;

      i++;

      // The end must only match domainFirstCharset so
      // only check whether current char is not -
      if (i === strLen)
        return code !== 45;

      matchCount++;
    } else
      // Char cannot match domainFirstCharset if it
      // does not match domainNextCharset
      return false;
  }
}
