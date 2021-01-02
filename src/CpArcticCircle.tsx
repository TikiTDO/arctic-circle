/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
/* eslint-disable no-bitwise */
/**
 * Copyright © 2020 TikiTDO
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the “Software”), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

enum Direction {
  N,
  E,
  S,
  W,
}

type XY = Array<number>

type VertexRecord = Array<number> //[x: number, y: number, direction: Direction]

// const startingPoints: Record<string, Array<VertexRecord>> = {
const startingPointsEastWest: Array<VertexRecord> = [
  [1, 0, Direction.W],
  [-1, 0, Direction.E],
]
const startingPointsNorthSouth: Array<VertexRecord> = [
  [0, 1, Direction.N],
  [0, -1, Direction.S],
]
// }

const maxUint32 = -1

// Use system random provider instead of slow browser random
const randomDataArraySize = 32
const cryptoRandom = {
  arrayIndex: randomDataArraySize,
  boolean: (): boolean => {
    let bitMask: number = cryptoRandom.byteBitMask
    let arrayIndex: number = cryptoRandom.arrayIndex

    // When an array entry is tapped out go to the next entry, or get more data
    if (bitMask === maxUint32) {
      if (arrayIndex === randomDataArraySize) {
        crypto.getRandomValues(cryptoRandom.data)
        arrayIndex = 0
        bitMask = 0
      } else {
        arrayIndex = arrayIndex + 1
        bitMask = 0
      }
    }

    /**
     * 1. Get the bit mask which looks like:    ...0011...11
     * 2. Shift in extra zeroso it looks like:  ...0111...10
     * 3. Invert all original bits              ...1100...00
     * 4. AND steps 2 and 3                     ...0100...00
     * 5. Update the bit mask
     * 6. Use bit for random data
     */
    const newBit = ((bitMask << 1) | 1) & ~bitMask
    cryptoRandom.byteBitMask = bitMask | newBit
    cryptoRandom.arrayIndex = arrayIndex

    return Boolean(cryptoRandom.data[arrayIndex] & newBit)
  },
  byteBitMask: maxUint32,
  data: new Uint32Array(randomDataArraySize),
}

const getRandomBoolean = window.crypto
  ? cryptoRandom.boolean
  : () => Math.random() > 0.5

const generateStaringPoints = (
  buffer: Int16Array,
  index: number,
  origin: XY = [0, 0],
): void => {
  const startingPoint = getRandomBoolean()
    ? startingPointsNorthSouth
    : startingPointsEastWest

  buffer[index] = origin[0] + startingPoint[0][0]
  buffer[index + 1] = origin[1] + startingPoint[0][1]
  buffer[index + 2] = startingPoint[0][2]

  buffer[index + 3] = origin[0] + startingPoint[1][0]
  buffer[index + 4] = origin[1] + startingPoint[1][1]
  buffer[index + 5] = startingPoint[1][2]
}

const drawBox = (
  ctx: CanvasRenderingContext2D,
  origin: XY,
  stepSize: number,
  vertexX: number,
  vertexY: number,
  from: number,
): void => {
  // Never have a zero step size, because the image disappears
  if (stepSize <= 0) stepSize = 1

  const targetCanvasVertexX = origin[0] + vertexX * stepSize
  const targetCanvasVertexY = origin[1] + vertexY * stepSize

  const drawArrow = stepSize > 10

  // The actual box
  switch (from) {
    case Direction.E:
      ctx.fillStyle = "#F00"
      ctx.fillRect(
        targetCanvasVertexX,
        targetCanvasVertexY - stepSize,
        stepSize,
        2 * stepSize,
      ) // Box

      if (drawArrow) {
        const arrowTipX = targetCanvasVertexX + (stepSize * 1) / 3
        const arrowTipY = targetCanvasVertexY

        ctx.beginPath()
        ctx.moveTo(
          targetCanvasVertexX + (stepSize * 2) / 3,
          targetCanvasVertexY,
        ) // Arrow Body
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(
          targetCanvasVertexX + stepSize / 2,
          targetCanvasVertexY + stepSize / 6,
        ) // Arrow Head 1
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(
          targetCanvasVertexX + stepSize / 2,
          targetCanvasVertexY - stepSize / 6,
        ) // Arrow Head 2
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.stroke()
      }

      break

    case Direction.N:
      ctx.fillStyle = "#00F"
      ctx.fillRect(
        targetCanvasVertexX - stepSize,
        targetCanvasVertexY - stepSize,
        2 * stepSize,
        stepSize,
      ) // Box

      if (drawArrow) {
        const arrowTipX = targetCanvasVertexX
        const arrowTipY = targetCanvasVertexY - (stepSize * 1) / 3

        ctx.beginPath()
        ctx.moveTo(
          targetCanvasVertexX,
          targetCanvasVertexY - (stepSize * 2) / 3,
        ) // Arrow Body
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(
          targetCanvasVertexX - stepSize / 6,
          targetCanvasVertexY - stepSize / 2,
        ) // Arrow Head 1
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(
          targetCanvasVertexX + stepSize / 6,
          targetCanvasVertexY - stepSize / 2,
        ) // Arrow Head 2
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.stroke()
      }

      break
    case Direction.S:
      ctx.fillStyle = "#0F0"
      ctx.fillRect(
        targetCanvasVertexX - stepSize,
        targetCanvasVertexY,
        2 * stepSize,
        stepSize,
      ) // Box

      if (drawArrow) {
        const arrowTipX = targetCanvasVertexX
        const arrowTipY = targetCanvasVertexY + (stepSize * 1) / 3

        ctx.beginPath()
        ctx.moveTo(
          targetCanvasVertexX,
          targetCanvasVertexY + (stepSize * 2) / 3,
        ) // Arrow Body
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(
          targetCanvasVertexX + stepSize / 6,
          targetCanvasVertexY + stepSize / 2,
        ) // Arrow Head 1
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(
          targetCanvasVertexX - stepSize / 6,
          targetCanvasVertexY + stepSize / 2,
        ) // Arrow Head 2
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.stroke()
      }
      break
    case Direction.W:
      ctx.fillStyle = "#FF0"
      ctx.fillRect(
        targetCanvasVertexX - stepSize,
        targetCanvasVertexY - stepSize,
        stepSize,
        2 * stepSize,
      ) // Box

      if (drawArrow) {
        const arrowTipX = targetCanvasVertexX - (stepSize * 1) / 3
        const arrowTipY = targetCanvasVertexY

        ctx.beginPath()
        ctx.moveTo(
          targetCanvasVertexX - (stepSize * 2) / 3,
          targetCanvasVertexY,
        ) // Arrow Body
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(
          targetCanvasVertexX - stepSize / 2,
          targetCanvasVertexY - stepSize / 6,
        ) // Arrow Head 1
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(
          targetCanvasVertexX - stepSize / 2,
          targetCanvasVertexY + stepSize / 6,
        ) // Arrow Head 2
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.stroke()
      }

      break
  }

  // Target Vertex (Optional)
  if (drawArrow) {
    ctx.strokeRect(targetCanvasVertexX - 1, targetCanvasVertexY - 1, 2, 2)
  }
}

interface CircleState {
  collisionXYArray: Int16Array
  drawnXYArray: Array<XY>
  collisionIndexesToClear: Uint8Array
  previousCircleState?: CircleState
  recursionLevel: number
  preCollisionRecords: Int16Array
}

const initializeCircleState = (): CircleState => {
  const startingPoints = new Int16Array(2 * 3)
  generateStaringPoints(startingPoints, 0)

  const drawnXYArray = [
    [startingPoints[0], startingPoints[1]],
    [startingPoints[3], startingPoints[4]],
  ]

  return {
    collisionXYArray: new Int16Array(0),
    drawnXYArray,
    collisionIndexesToClear: new Uint8Array(0),
    recursionLevel: 1,
    preCollisionRecords: startingPoints,
  }
}

const CpArcticCircle: React.FC<Record<string, never>> = () => {
  const canvas = useRef<HTMLCanvasElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const [fixedStepSize, setFixedStepSize] = useState<undefined | number>(
    undefined,
  )

  const getCurrentStepSize = useCallback((recursionLevel: number): number => {
    const canvasElement = canvas.current
    if (canvasElement) {
      const ctx = canvasElement.getContext("2d")
      if (ctx) {
        return Math.floor(
          (Math.min(ctx.canvas.width, ctx.canvas.height) - 1) /
            (recursionLevel * 2),
        )
      }
    }
    return 1
  }, [])

  // Common state for all the UI
  const [circleState, setCircleState] = useState<CircleState>(
    initializeCircleState,
  )

  // Handler to start everything over
  const restart = useCallback(() => {
    setCircleState(initializeCircleState())
  }, [])
  const undo = useCallback(() => {
    setCircleState((currentCircleState) =>
      currentCircleState.previousCircleState
        ? currentCircleState.previousCircleState
        : currentCircleState,
    )
  }, [])

  // Whether to highlight new points (0 = no, 1 = bright, 2 = dark)
  const [showNewPoints, setShowNewPoints] = useState<number>(0)
  const toggleShowNewPoints = useCallback(
    () =>
      setShowNewPoints(
        (currentHideDrawnPoints) => (currentHideDrawnPoints + 1) % 3,
      ),
    [],
  )

  // Whether to highlight new conflicts (0 = no, 1 = bright, 2 = dark)
  const [showConflicts, setShowConflicts] = useState<number>(0)
  const toggleShowConflicts = useCallback(
    () =>
      setShowConflicts(
        (currentShowConflicts) => (currentShowConflicts + 1) % 3,
      ),
    [],
  )

  // Don't auto-zoom in and and out
  const toggleFixStepSize = useCallback(() => {
    if (fixedStepSize) {
      setFixedStepSize(undefined)
    } else {
      setFixedStepSize(getCurrentStepSize(circleState.recursionLevel))
    }
  }, [circleState, fixedStepSize, getCurrentStepSize])

  // Set maximum zoom
  const toggleZoomOut = useCallback(() => {
    setFixedStepSize(1)
  }, [])

  // Take a single AC step
  const performStep = useCallback(
    (): Promise<void> =>
      new Promise((resolve) => {
        setCircleState((previousCircleState) => {
          performance.clearMarks()
          performance.clearMeasures()

          const newRecursionLevel = previousCircleState.recursionLevel + 1
          const dataRowSize = newRecursionLevel * 2
          const dataSize = dataRowSize ** 2 + dataRowSize

          // Helper to create a non-colliding numeric key which can uniquely index into a memory blob
          const getCollisionKey = (x: number, y: number): number =>
            x + newRecursionLevel + (y + newRecursionLevel) * dataRowSize

          // Convert from a collision key back into an (X, Y) point
          const getPointFromCollisionKey = (collisionKey: number): XY => [
            (collisionKey % dataRowSize) - newRecursionLevel,
            Math.trunc(collisionKey / dataRowSize) - newRecursionLevel,
          ]
          const performanceMarkStart = `Started Calculations ${newRecursionLevel}}`
          performance.mark(performanceMarkStart)

          const collisionIndexesCreated = new Uint8Array(dataSize)
          const collisionIndexesSeen = new Uint8Array(dataSize)

          // The data array representing the pre collision state from last run
          const preCollisionRecords = previousCircleState.preCollisionRecords

          // The data array representing the state after clearing collisions
          let postCollisionIndex = 0
          const postCollisionRecords = new Int16Array(
            preCollisionRecords.length,
          )
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
              !previousCircleState.collisionIndexesToClear[
                preCollisionRecordsIndex
              ]
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
          const drawnXY = []
          for (let i = 0; i < dataSize; i++) {
            if (collisionIndexesCreated[i]) {
              drawnXY.push(getPointFromCollisionKey(i))
            }
          }

          // Generated new records into the result array
          drawnXY.forEach((point) => {
            generateStaringPoints(finalRecords, finalIndex, point)
            finalIndex = finalIndex + 6
          })

          finalRecords = finalRecords.subarray(0, finalIndex)

          const performanceMarkAfterThirdLoop = `After Third Loop ${newRecursionLevel}}`
          performance.mark(performanceMarkAfterThirdLoop)

          // Find Collisions for new record set
          let actualCollisionIndex = 0
          const actualCollisionXY: Int16Array = new Int16Array(
            (finalRecords.length / 3) * 2,
          )
          const collisionIndexesToClear: Uint8Array = new Uint8Array(dataSize)
          // const newSeen: Record<string, number> = {}

          const seenCollisionsForNewCollisionKey = new Uint32Array(dataSize)

          for (
            let futureCollisionIndex = 0;
            futureCollisionIndex < finalRecords.length;
            futureCollisionIndex = futureCollisionIndex + 3
          ) {
            const pointX = finalRecords[futureCollisionIndex]
            const pointY = finalRecords[futureCollisionIndex + 1]

            // Store collision data for later
            const collisionKey = getCollisionKey(pointX, pointY)
            if (seenCollisionsForNewCollisionKey[collisionKey] !== 0) {
              // Found a collision
              actualCollisionXY[actualCollisionIndex++] = pointX
              actualCollisionXY[actualCollisionIndex++] = pointY

              collisionIndexesToClear[futureCollisionIndex] = 1
              collisionIndexesToClear[
                seenCollisionsForNewCollisionKey[collisionKey] - 1
              ] = 1
            }

            seenCollisionsForNewCollisionKey[collisionKey] =
              futureCollisionIndex + 1
          }

          resolve()

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
            collisionXYArray: actualCollisionXY.subarray(
              0,
              actualCollisionIndex,
            ),
            drawnXYArray: drawnXY,
            collisionIndexesToClear,
            previousCircleState,
            recursionLevel: newRecursionLevel,
            preCollisionRecords: finalRecords,
          }
        })
      }),
    [],
  )

  // Handle looping
  const [loop, setLoop] = useState(0)
  const toggleLoop = useCallback(
    () => setLoop((currentLoop) => (currentLoop > 0 ? 0 : 1)),
    [],
  )
  useLayoutEffect(() => {
    if (loop) {
      const timeoutId = setTimeout(() => {
        performStep().then(() =>
          setLoop((currentLoop) => (currentLoop > 0 ? currentLoop + 1 : 0)),
        )
      }, 10)
      return () => clearTimeout(timeoutId)
    } else {
      return
    }
  }, [loop, performStep])

  const [rewind, setRewind] = useState(0)
  const toggleRewind = useCallback(
    () => setRewind((currentRewind) => (currentRewind > 0 ? 0 : 1)),
    [],
  )
  useLayoutEffect(() => {
    if (rewind) {
      const timeoutId = setTimeout(() => {
        undo()
        setRewind((currentRewind) => currentRewind + 1)
      }, 100)
      return () => clearTimeout(timeoutId)
    } else {
      return
    }
  }, [loop, performStep, rewind, undo])

  const headerElement = headerRef.current
  const headerHeight = headerElement?.clientHeight ?? 0

  const [resizeNumber, setResizeNumber] = useState(0)

  useEffect(() => {
    const update = (): void => {
      setResizeNumber((currentResizeNumber) => currentResizeNumber + 1)
    }
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  // Render the current step
  useEffect(() => {
    performance.clearMarks()
    performance.clearMeasures()

    const canvasElement = canvas.current
    // The extra condition forces a redraw after resize
    if (canvasElement && resizeNumber >= 0) {
      const currentRecursionLevel = circleState.recursionLevel
      const performanceMarkStart = `Started Draw ${currentRecursionLevel}`
      performance.mark(performanceMarkStart)
      const ctx = canvasElement.getContext("2d")

      if (ctx) {
        // How big a box is on the canvas
        const stepSize =
          fixedStepSize ?? getCurrentStepSize(circleState.recursionLevel)

        // Center coordinates of the canvas
        const origin: XY = [ctx.canvas.width / 2, ctx.canvas.height / 2]

        ctx.lineWidth = 1
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
        // Draw the main boxes
        for (let i = 0; i < circleState.preCollisionRecords.length; i = i + 3) {
          drawBox(
            ctx,
            origin,
            stepSize,
            circleState.preCollisionRecords[i],
            circleState.preCollisionRecords[i + 1],
            circleState.preCollisionRecords[i + 2],
          )
        }

        if (circleState.collisionXYArray && showConflicts !== 0) {
          for (
            let collisionIndex = 0;
            collisionIndex < circleState.collisionXYArray.length;
            collisionIndex = collisionIndex + 2
          ) {
            const pointX = circleState.collisionXYArray[collisionIndex]
            const pointY = circleState.collisionXYArray[collisionIndex + 1]

            ctx.fillStyle =
              showConflicts === 1 ? "rgba(255,255,255,0.99)" : "rgba(0,0,0,0.9)"

            ctx.fillRect(
              origin[0] + (pointX - 1) * stepSize,
              origin[1] + (pointY - 1) * stepSize,
              2 * stepSize,
              2 * stepSize,
            ) // Box around conflicts
          }
        }

        // If we're going slowly, render the current candidates too
        if (circleState.drawnXYArray && showNewPoints !== 0) {
          circleState.drawnXYArray.forEach((drawPoint) => {
            ctx.fillStyle =
              showNewPoints === 1
                ? "rgba(255,220,220,0.80)"
                : "rgba(60,60,60,0.8)"
            ctx.fillRect(
              origin[0] + (drawPoint[0] - 1) * stepSize,
              origin[1] + (drawPoint[1] - 1) * stepSize,
              2 * stepSize,
              2 * stepSize,
            ) // Box around new records
          })
        }
      }

      const performanceMarkEnd = `Finished Draw ${circleState.recursionLevel}}`
      performance.mark(performanceMarkEnd)

      const measureName = `Draw Time for ${circleState.recursionLevel}`
      performance.measure(measureName, performanceMarkStart, performanceMarkEnd)
      const performanceEntries = performance.getEntriesByName(measureName)
      const latestMeasure = performanceEntries[performanceEntries.length - 1]
      console.log(
        JSON.stringify({
          recursionLevel: circleState.recursionLevel,
          result: [
            {
              [latestMeasure.name]: `${Math.round(latestMeasure.duration)}ms`,
            },
          ],
        }),
      )
    }
  }, [
    fixedStepSize,
    showNewPoints,
    circleState,
    showConflicts,
    getCurrentStepSize,
    resizeNumber,
  ])

  // Render some controls, and the canvas with the circle
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div ref={headerRef}>
        <div>
          {!rewind && !loop && <button onClick={restart}>Restart</button>}
          {!rewind && !loop && <button onClick={performStep}>Next</button>}
          {!rewind && !loop && <button onClick={undo}>Undo</button>}
          {!rewind && (
            <button onClick={toggleLoop}>
              {loop ? "Stop Loop" : "Start Loop"}
            </button>
          )}
          {!loop && (
            <button onClick={toggleRewind}>
              {rewind ? "Stop Rewind" : "Start Rewind"}
            </button>
          )}
        </div>
        <div>
          <button onClick={toggleShowNewPoints}>
            New Records are{" "}
            {showNewPoints === 0
              ? "Not Highlighted"
              : showNewPoints === 1
              ? "Bright"
              : "Dark"}
          </button>
          <button onClick={toggleShowConflicts}>
            Conflicts are{" "}
            {showConflicts === 0
              ? "Not Highlighted"
              : showConflicts === 1
              ? "Bright"
              : "Dark"}
          </button>
          <button onClick={toggleFixStepSize}>
            Zoom Level{" "}
            {fixedStepSize === undefined ? "Not Fixed" : `${fixedStepSize}px`}
          </button>
          <button onClick={toggleZoomOut}>Zoom Out</button>
        </div>
      </div>
      <canvas
        height={window.innerHeight - headerHeight}
        ref={canvas}
        style={{
          objectFit: "contain",
        }}
        width={window.innerWidth}
      />
    </div>
  )
}

export default CpArcticCircle
