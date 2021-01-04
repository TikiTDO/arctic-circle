// eslint-disable-next-line @typescript-eslint/no-unused-vars
import CircleState, { Direction } from "../CircleState"
import { getRandomBoolean } from "./randomProvider"

type VertexRecord = Array<number> //[x: number, y: number, direction: Direction]

const startingPointsEastWest: Array<VertexRecord> = [
  [1, 0, Direction.W],
  [-1, 0, Direction.E],
]
const startingPointsNorthSouth: Array<VertexRecord> = [
  [0, 1, Direction.N],
  [0, -1, Direction.S],
]

export const generateStaringPoints = (
  buffer: Int16Array,
  index: number,
  originX = 0,
  originY = 0,
): void => {
  const startingPoint = getRandomBoolean()
    ? startingPointsNorthSouth
    : startingPointsEastWest

  buffer[index] = originX + startingPoint[0][0]
  buffer[index + 1] = originY + startingPoint[0][1]
  buffer[index + 2] = startingPoint[0][2]

  buffer[index + 3] = originX + startingPoint[1][0]
  buffer[index + 4] = originY + startingPoint[1][1]
  buffer[index + 5] = startingPoint[1][2]
}

interface RecursionHelpers {
  dataSize: number
  getCollisionKey: (x: number, y: number) => number
  getXFromCollisionKey: (collisionKey: number) => number
  getYFromCollisionKey: (collisionKey: number) => number
}

export const getRecursionHelpers = (
  recursionLevel: number,
): RecursionHelpers => {
  const dataRowSize = recursionLevel * 2
  const dataSize = dataRowSize ** 2 + dataRowSize

  return {
    dataSize,
    /**
     * Helper to create a non-colliding numeric key which can uniquely index into a memory blob
     */
    getCollisionKey: (x: number, y: number): number =>
      x + recursionLevel + (y + recursionLevel) * dataRowSize,

    getXFromCollisionKey: (collisionKey: number): number =>
      (collisionKey % dataRowSize) - recursionLevel,
    getYFromCollisionKey: (collisionKey: number): number =>
      Math.trunc(collisionKey / dataRowSize) - recursionLevel,
  }
}

// Take a single AC step

const computeStep = (
  previousCircleState: CircleState,
  saveMemory: boolean,
): CircleState => {
  performance.clearMarks()
  performance.clearMeasures()

  const newRecursionLevel = previousCircleState.recursionLevel + 1
  const {
    dataSize,
    getCollisionKey,
    getXFromCollisionKey,
    getYFromCollisionKey,
  } = getRecursionHelpers(newRecursionLevel)

  const performanceMarkStart = `Started Calculations ${newRecursionLevel}}`
  performance.mark(performanceMarkStart)

  const collisionIndexesCreated = new Uint8Array(dataSize)
  const collisionIndexesSeen = new Uint8Array(dataSize)

  // The data array representing the pre collision state from last run
  const preCollisionRecords = previousCircleState.preCollisionRecords

  // The data array representing the state after clearing collisions
  let postCollisionIndex = 0
  const postCollisionRecords = new Int16Array(preCollisionRecords.length)
  for (
    let preCollisionRecordsIndex = 0;
    preCollisionRecordsIndex < preCollisionRecords.length;
    preCollisionRecordsIndex = preCollisionRecordsIndex + 3
  ) {
    const pointX = preCollisionRecords[preCollisionRecordsIndex]
    const pointY = preCollisionRecords[preCollisionRecordsIndex + 1]
    const direction = preCollisionRecords[preCollisionRecordsIndex + 2]

    // Mark the candidates for a new draw
    let candidateCollisionA: number
    let candidateCollisionB: number

    switch (direction) {
      case Direction.E:
        candidateCollisionA = getCollisionKey(pointX + 1, pointY + 1)
        candidateCollisionB = getCollisionKey(pointX + 1, pointY - 1)
        break
      case Direction.N:
        candidateCollisionA = getCollisionKey(pointX + 1, pointY - 1)
        candidateCollisionB = getCollisionKey(pointX - 1, pointY - 1)
        break
      case Direction.S:
        candidateCollisionA = getCollisionKey(pointX + 1, pointY + 1)
        candidateCollisionB = getCollisionKey(pointX - 1, pointY + 1)
        break
      case Direction.W:
        candidateCollisionA = getCollisionKey(pointX - 1, pointY + 1)
        candidateCollisionB = getCollisionKey(pointX - 1, pointY - 1)
        break
      default:
        throw new Error("Missing direction")
    }

    // Check if either of the candidates has been seen yet, and if so clear them out
    // Otherwise mark them as possibly valid creation targets
    if (collisionIndexesSeen[candidateCollisionA]) {
      collisionIndexesCreated[candidateCollisionA] = 0
    } else {
      collisionIndexesCreated[candidateCollisionA] = 1
    }

    if (collisionIndexesSeen[candidateCollisionB]) {
      collisionIndexesCreated[candidateCollisionB] = 0
    } else {
      collisionIndexesCreated[candidateCollisionB] = 1
    }

    // Mark the current node as seen
    const itemCollisionKey = getCollisionKey(pointX, pointY)
    if (collisionIndexesCreated[itemCollisionKey]) {
      collisionIndexesCreated[itemCollisionKey] = 0
    }
    collisionIndexesSeen[itemCollisionKey] = 1

    // Keep only the records that were not in a collision state
    if (
      !previousCircleState.collisionIndexesToRemove[preCollisionRecordsIndex]
    ) {
      postCollisionRecords[postCollisionIndex++] = pointX
      postCollisionRecords[postCollisionIndex++] = pointY
      postCollisionRecords[postCollisionIndex++] = direction
    }
  }

  // const postCollisionRecords = previousCircleState.preCollisionRecords.filter(
  //   ([pointX, pointY, direction], preCollisionIndex) => {
  //     preCollisionIndex
  //     const [pointX, pointY, direction]

  //     // Keep the old vertext if it wasn't in collision state
  //     return !previousCircleState.indexesToClear[preCollisionIndex]
  //   },
  // )

  const performanceMarkAfterFirstLoop = `After First Loop ${newRecursionLevel}}`
  performance.mark(performanceMarkAfterFirstLoop)

  // Perform Moves from this run
  let finalIndex = 0
  let finalRecords = new Int16Array(dataSize * 3)

  for (
    finalIndex = 0;
    finalIndex < postCollisionIndex;
    finalIndex = finalIndex + 3
  ) {
    const vertexX = postCollisionRecords[finalIndex]
    const vertexY = postCollisionRecords[finalIndex + 1]
    const direction = postCollisionRecords[finalIndex + 2]
    switch (direction) {
      case Direction.E:
        finalRecords[finalIndex] = vertexX - 1
        finalRecords[finalIndex + 1] = vertexY
        finalRecords[finalIndex + 2] = direction
        break
      case Direction.N:
        finalRecords[finalIndex] = vertexX
        finalRecords[finalIndex + 1] = vertexY + 1
        finalRecords[finalIndex + 2] = direction
        break
      case Direction.S:
        finalRecords[finalIndex] = vertexX
        finalRecords[finalIndex + 1] = vertexY - 1
        finalRecords[finalIndex + 2] = direction
        break
      case Direction.W:
        finalRecords[finalIndex] = vertexX + 1
        finalRecords[finalIndex + 1] = vertexY
        finalRecords[finalIndex + 2] = direction
        break
      default:
        throw new Error("Invalid Direction")
    }
  }

  const performanceMarkAfterSecondLoop = `After Second Loop ${newRecursionLevel}}`
  performance.mark(performanceMarkAfterSecondLoop)

  // Find the XY coordinates for the points to be generated
  let drawnXyIndex = 0
  const generatedXYArray = new Int16Array(dataSize)
  for (let i = 0; i < dataSize; i++) {
    if (collisionIndexesCreated[i]) {
      const pointX = getXFromCollisionKey(i)
      const pointY = getYFromCollisionKey(i)
      generatedXYArray[drawnXyIndex] = pointX
      generatedXYArray[drawnXyIndex + 1] = pointY
      drawnXyIndex = drawnXyIndex + 2

      generateStaringPoints(finalRecords, finalIndex, pointX, pointY)
      finalIndex = finalIndex + 6
    }
  }

  finalRecords = finalRecords.slice(0, finalIndex)

  const performanceMarkAfterThirdLoop = `After Third Loop ${newRecursionLevel}}`
  performance.mark(performanceMarkAfterThirdLoop)

  // Find Collisions for new record set
  let collisionXYArrayIndex = 0
  const collisionXYArray: Int16Array = new Int16Array(
    (finalRecords.length / 3) * 2,
  )
  const collisionIndexesToRemove: Uint8Array = new Uint8Array(dataSize)
  // const newSeen: Record<string, number> = {}

  const seenCollisionsForNewCollisionKey = new Uint32Array(dataSize)

  let futureCollisionIndex
  for (
    futureCollisionIndex = 0;
    futureCollisionIndex < finalRecords.length;
    futureCollisionIndex = futureCollisionIndex + 3
  ) {
    const pointX = finalRecords[futureCollisionIndex]
    const pointY = finalRecords[futureCollisionIndex + 1]

    // Store collision data for later
    const collisionKey = getCollisionKey(pointX, pointY)
    if (seenCollisionsForNewCollisionKey[collisionKey] !== 0) {
      // Found a collision
      collisionXYArray[collisionXYArrayIndex++] = pointX
      collisionXYArray[collisionXYArrayIndex++] = pointY

      collisionIndexesToRemove[futureCollisionIndex] = 1
      collisionIndexesToRemove[
        seenCollisionsForNewCollisionKey[collisionKey] - 1
      ] = 1
    }

    seenCollisionsForNewCollisionKey[collisionKey] = futureCollisionIndex + 1
  }

  // Log run performance
  const performanceMarkEnd = `Finished Calculations ${newRecursionLevel}}`
  performance.mark(performanceMarkEnd)

  const measureWholeExecution = `Calculation Execution Time for ${newRecursionLevel}`
  performance.measure(
    measureWholeExecution,
    performanceMarkStart,
    performanceMarkEnd,
  )

  const measureFirstLoop = `First Loop for ${newRecursionLevel}`
  performance.measure(
    measureFirstLoop,
    performanceMarkStart,
    performanceMarkAfterFirstLoop,
  )

  const measureSecondLoop = `Second Loop for ${newRecursionLevel}`
  performance.measure(
    measureSecondLoop,
    performanceMarkAfterFirstLoop,
    performanceMarkAfterSecondLoop,
  )

  const measureThirdLoop = `Third Loop for ${newRecursionLevel}`
  performance.measure(
    measureThirdLoop,
    performanceMarkAfterSecondLoop,
    performanceMarkAfterThirdLoop,
  )

  const measureFourthLoop = `Fourth Loop for ${newRecursionLevel}`
  performance.measure(
    measureFourthLoop,
    performanceMarkAfterThirdLoop,
    performanceMarkEnd,
  )

  const performanceEntries = [
    ...performance.getEntriesByName(measureWholeExecution),
    ...performance.getEntriesByName(measureFirstLoop),
    ...performance.getEntriesByName(measureSecondLoop),
    ...performance.getEntriesByName(measureThirdLoop),
    ...performance.getEntriesByName(measureFourthLoop),
  ]

  console.log(
    JSON.stringify({
      recursionLevel: newRecursionLevel,
      result: performanceEntries.map((measure) => ({
        [measure.name]: `${Math.round(measure.duration)}ms`,
      })),
    }),
  )

  // Return the new circle state
  return {
    collisionXYArray: collisionXYArray.slice(0, collisionXYArrayIndex),
    generatedXYArray: generatedXYArray.slice(0, drawnXyIndex),
    collisionIndexesToRemove: collisionIndexesToRemove.slice(
      0,
      futureCollisionIndex,
    ),
    previousCircleState: saveMemory ? undefined : previousCircleState,
    recursionLevel: newRecursionLevel,
    preCollisionRecords: finalRecords,
  }
}

export default computeStep
