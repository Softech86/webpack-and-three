export const white = 0xffffff
export const lightGray = 0xdddddd
export const gray = 0x909090
export const darkGray = 0x404040
export const black = 0x000000
export const red = 0xff4444
export const yellow = 0xffff00
export const blue = 0x6cbdff
export const darkBlue = 0x203d6b

export const list = 'f44336e91e639c27b0673ab73f51b52196f303a9f400bcd40096884caf508bc34acddc39ffeb3bffc107ff9800ff57227955489e9e9e607d8b'.match(/.{6}/g).map(x => parseInt('0x' + x, 16))

export const toRGB = color => ((1 << 24) + color).toString(16).slice(1).match(/.{2}/g).map(x => parseInt(x, 16))
export const toHex = color => '#' + ((1 << 24) + color).toString(16).slice(1)
export const getBrightness = color => toRGB(color).reduce((s, x, i) => s + x * [0.3, 0.6, 0.1][i], 0) / 255.0
