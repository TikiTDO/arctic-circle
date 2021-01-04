export enum Direction {
  N,
  E,
  S,
  W,
}

export default interface CircleState {
  collisionXYArray: Int16Array
  generatedXYArray: Int16Array
  collisionIndexesToRemove: Uint8Array
  previousCircleState?: CircleState
  recursionLevel: number
  preCollisionRecords: Int16Array
}
