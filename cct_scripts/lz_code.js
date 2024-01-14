export function encode(normalString) {
  let cur_state = Array.from(Array(10), () => Array(10).fill(null));
  let new_state = Array.from(Array(10), () => Array(10));

  function set(state, i, j, str) {
    const current = state[i][j];
    if (current == null || str.length < current.length) {
      state[i][j] = str;
    } else if (str.length === current.length && Math.random() < 0.5) {
      state[i][j] = str;
    }
  }
  cur_state[0][1] = "";

  for (let i = 1; i < normalString.length; ++i) {
    for (const row of new_state) {
      row.fill(null);
    }
    const c = normalString[i];

    for (let length = 1; length <= 9; ++length) {
      const string = cur_state[0][length];
      if (string == null) {
        continue;
      }

      if (length < 9) {
        set(new_state, 0, length + 1, string);
      } else {
        set(new_state, 0, 1, string + "9" + normalString.substring(i - 9, i) + "0");
      }

      for (let offset = 1; offset <= Math.min(9, i); ++offset) {
        if (normalString[i - offset] === c) {
          set(new_state, offset, 1, string + String(length) + normalString.substring(i - length, i));
        }
      }
    }

    for (let offset = 1; offset <= 9; ++offset) {
      for (let length = 1; length <= 9; ++length) {
        const string = cur_state[offset][length];
        if (string == null) {
          continue;
        }

        if (normalString[i - offset] === c) {
          if (length < 9) {
            set(new_state, offset, length + 1, string);
          } else {
            set(new_state, offset, 1, string + "9" + String(offset) + "0");
          }
        }

        set(new_state, 0, 1, string + String(length) + String(offset));

        for (let new_offset = 1; new_offset <= Math.min(9, i); ++new_offset) {
          if (normalString[i - new_offset] === c) {
            set(new_state, new_offset, 1, string + String(length) + String(offset) + "0");
          }
        }
      }
    }

    const tmp_state = new_state;
    new_state = cur_state;
    cur_state = tmp_state;
  }

  let result = null;

  for (let len = 1; len <= 9; ++len) {
    let string = cur_state[0][len];
    if (string == null) {
      continue;
    }

    string += String(len) + normalString.substring(normalString.length - len, normalString.length);
    if (result == null || string.length < result.length) {
      result = string;
    } else if (string.length == result.length && Math.random() < 0.5) {
      result = string;
    }
  }

  for (let offset = 1; offset <= 9; ++offset) {
    for (let len = 1; len <= 9; ++len) {
      let string = cur_state[offset][len];
      if (string == null) {
        continue;
      }

      string += String(len) + "" + String(offset);
      if (result == null || string.length < result.length) {
        result = string;
      } else if (string.length == result.length && Math.random() < 0.5) {
        result = string;
      }
    }
  }

  return result || "";
}

export function decode(compr) {
    let plain = "";

    for (let i = 0; i < compr.length;) {
        const literal_length = compr.charCodeAt(i) - 0x30;

        if (literal_length < 0 || literal_length > 9 || i + 1 + literal_length > compr.length) {
            return null;
        }

        plain += compr.substring(i + 1, i + 1 + literal_length);
        i += 1 + literal_length;

        if (i >= compr.length) {
            break;
        }

        const backref_length = compr.charCodeAt(i) - 0x30;

        if (backref_length < 0 || backref_length > 9) {
            return null;
        } else if (backref_length === 0) {
            ++i;
        } else {
            if (i + 1 >= compr.length) {
                return null;
            }

            const backref_offset = compr.charCodeAt(i + 1) - 0x30;
            if ((backref_length > 0 && (backref_offset < 1 || backref_offset > 9)) || backref_offset > plain.length) {
                return null;
            }

            for (let j = 0; j < backref_length; ++j) {
                plain += plain[plain.length - backref_offset];
            }

            i += 2;
        }
    }

    return plain;
}