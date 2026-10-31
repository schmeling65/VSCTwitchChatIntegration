const suffixes = ["th", "st", "nd", "rd"];

export function NumberToOrdinal(_number: number) {
    const v = Math.abs(_number) % 100;
    return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]
}