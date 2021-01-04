// The directions we can move
export enum Direction {
  N,
  E,
  S,
  W,
}
// The number of directions we can move
export const directionCount = 4

export default interface CircleState {
  collisionXYArray: Int16Array
  generatedXYArray: Int16Array
  collisionIndexesToRemove: Uint8Array
  previousCircleState?: CircleState
  recursionLevel: number
  preCollisionRecords: Int16Array
}
