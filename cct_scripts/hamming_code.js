export function encode(data) {
  const enc = [0];
  const data_bits = data.toString(2).split("").reverse();

  data_bits.forEach((e, i, a) => {
    a[i] = parseInt(e);
  });

  let k = data_bits.length;

  for (let i = 1; k > 0; i++) {
    if ((i & (i - 1)) !== 0) {
      enc[i] = data_bits[--k];
    } else {
      enc[i] = 0;
    }
  }

  let parity = 0;

  for (let i = 0; i < enc.length; i++) {
    if (enc[i]) {
      parity ^= i;
    }
  }

  parity = parity.toString(2).split("").reverse();
  parity.forEach((e, i, a) => {
    a[i] = parseInt(e);
  });

  for (let i = 0; i < parity.length; i++) {
    enc[Math.pow(2, i)] = parity[i] ? 1 : 0;
  }

  parity = 0;

  for (let i = 0; i < enc.length; i++) {
    if (enc[i]) {
      parity++;
    }
  }

  enc[0] = parity % 2 === 0 ? 0 : 1;

  return enc.join("");
}

export function encodeProperly(data) {
  let m = 1;

  while (Math.pow(2, Math.pow(2, m) - m - 1) - 1 < data) {
    m++;
  }

  const n = Math.pow(2, m);
  const k = Math.pow(2, m) - m - 1;

  const enc = [0];
  const data_bits = data.toString(2).split("").reverse();

  data_bits.forEach((e, i, a) => {
    a[i] = parseInt(e);
  });

  for (let i = 1, j = k; i < n; i++) {
    if ((i & (i - 1)) !== 0) {
      enc[i] = data_bits[--j] ? data_bits[j] : 0;
    }
  }

  let parity = 0;

  for (let i = 0; i < n; i++) {
    if (enc[i]) {
      parity ^= i;
    }
  }

  parity = parity.toString(2).split("").reverse();
  parity.forEach((e, i, a) => {
    a[i] = parseInt(e);
  });

  for (let i = 0; i < m; i++) {
    enc[Math.pow(2, i)] = parity[i] ? 1 : 0;
  }

  parity = 0;

  for (let i = 0; i < n; i++) {
    if (enc[i]) {
      parity++;
    }
  }

  enc[0] = parity % 2 === 0 ? 0 : 1;

  return enc.join("");
}

export function decode(data) {
  let err = 0;
  const bits = [];

  for (const i in data.split("")) {
    const bit = parseInt(data[i]);
    bits[i] = bit;

    if (bit) {
      err ^= +i;
    }
  }

  if (err) {
    bits[err] = bits[err] ? 0 : 1;
  }

  let ans = "";

  for (let i = 1; i < bits.length; i++) {
    if ((i & (i - 1)) !== 0) {
      ans += bits[i];
    }
  }

  return parseInt(ans, 2);
}