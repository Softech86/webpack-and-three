
export const COLOR = {
    white: 0xffffff,
    lightGray: 0xdddddd,
    gray: 0x909090,
    darkGray: 0x404040,
    black: 0x000000,
    red: 0xff4444,
    yellow: 0xffff00,
    blue: 0x6cbdff,
    darkBlue: 0x203d6b,
    list: 'f44336e91e639c27b0673ab73f51b52196f303a9f400bcd40096884caf508bc34acddc39ffeb3bffc107ff9800ff57227955489e9e9e607d8b'.match(/.{6}/g).map(x => parseInt('0x' + x, 16))
}