export const hexToRgb = (hex: string) => {
  let r = "",
    g = "",
    b = "";

  // 3 digits
  if (hex.length < 7) {
    r = `0x${hex[1]}${hex[1]}`;
    g = `0x${hex[2]}${hex[2]}`;
    b = `0x${hex[3]}${hex[3]}`;

    // 6 digits
  } else {
    r = `0x${hex[1]}${hex[2]}`;
    g = `0x${hex[3]}${hex[4]}`;
    b = `0x${hex[5]}${hex[6]}`;
  }

  return { r: +r, g: +g, b: +b, rgb: `${+r} ${+g} ${+b}` };
};
