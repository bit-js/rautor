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

// See https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address for more infos
export function isEmail(str: string): boolean {
  const strLen = str.length;
  if (strLen === 0) return false;

  for (let i = 0, code; ;) {
    // Validate the part before @
    code = str.charCodeAt(i);

    // Most likely to happen
    if (firstPartCharset[code] === null) {
      i++;
      if (i === strLen) return false;
      continue;
    }

    // Only happen once so put it after
    if (code === 64) {
      i++;

      // First char after @ must be a char in domainFirstCharset
      if (i === strLen || domainFirstCharset[str.charCodeAt(i)] !== null) return false;

      i++;
      // Search for domain dots
      let dotIdx = str.indexOf('.', i);
      let matchCount = 0;

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

    return false;
  }
}
