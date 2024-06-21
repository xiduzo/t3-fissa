const formatter = new Intl.NumberFormat("en-US")

export function formatNumber(input: number) {
  return formatter.format(input)
}
