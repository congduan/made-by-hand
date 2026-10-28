export type PieceType = 'square' | 'triangle_eq' | 'triangle_right' | 'pentagon'
export type CraftMode = 'magnets' | 'origami' | 'papercraft'
export type Tutorial = 'cube' | 'pyramid' | 'house' | null
export const PIECE_NAMES: Record<PieceType, string> = {
  square: '正方形',
  triangle_eq: '等边三角形',
  triangle_right: '直角三角形',
  pentagon: '五边形',
}
export const PIECE_COLORS: Record<PieceType, number> = {
  square: 0xff5a8a,
  triangle_eq: 0x39c5ff,
  triangle_right: 0x8aff5a,
  pentagon: 0xffc53d,
}
