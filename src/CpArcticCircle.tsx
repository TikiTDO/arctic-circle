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
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

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
    const newBit = ((bitMask << 1) |1) & (~bitMask)
    cryptoRandom.byteBitMask = bitMask | newBit
    cryptoRandom.arrayIndex = arrayIndex

    return Boolean(cryptoRandom.data[arrayIndex] & newBit)
  },
  byteBitMask: maxUint32,
  data: new Uint32Array(randomDataArraySize),
}

const getRandomBoolean = window.crypto ? cryptoRandom.boolean : () => Math.random() > 0.5

const generateStaringPoints = (origin: XY = [0, 0]): Array<VertexRecord> => {
  const startingPoint = getRandomBoolean() ? startingPointsNorthSouth : startingPointsEastWest
  return startingPoint.map(([startingPointX, startingPointY, direction]) => [
    origin[0] + startingPointX,
    origin[1] + startingPointY,
    direction,
  ])
}

const drawBox = (
  ctx: CanvasRenderingContext2D,
  origin: XY,
  stepSize: number,
  vertexRecord: VertexRecord,
): void => {
  const [vertexX, vertexY, from] = vertexRecord

  const targetCanvasVertexX = origin[0] + vertexX * stepSize
  const targetCanvasVertexY = origin[1] + vertexY * stepSize

  const drawArrow = stepSize > 10

  // The actual box
  switch (from) {
    case Direction.E:
      ctx.fillStyle = "#F00"
      ctx.fillRect(targetCanvasVertexX, targetCanvasVertexY - stepSize, stepSize, 2 * stepSize) // Box

      if (drawArrow) {
        const arrowTipX = targetCanvasVertexX + (stepSize * 1) / 3
        const arrowTipY = targetCanvasVertexY

        ctx.beginPath()
        ctx.moveTo(targetCanvasVertexX + (stepSize * 2) / 3, targetCanvasVertexY) // Arrow Body
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX + stepSize / 2, targetCanvasVertexY + stepSize / 6) // Arrow Head 1
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX + stepSize / 2, targetCanvasVertexY - stepSize / 6) // Arrow Head 2
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
        ctx.moveTo(targetCanvasVertexX, targetCanvasVertexY - (stepSize * 2) / 3) // Arrow Body
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX - stepSize / 6, targetCanvasVertexY - stepSize / 2) // Arrow Head 1
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX + stepSize / 6, targetCanvasVertexY - stepSize / 2) // Arrow Head 2
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.stroke()
      }

      break
    case Direction.S:
      ctx.fillStyle = "#0F0"
      ctx.fillRect(targetCanvasVertexX - stepSize, targetCanvasVertexY, 2 * stepSize, stepSize) // Box

      if (drawArrow) {
        const arrowTipX = targetCanvasVertexX
        const arrowTipY = targetCanvasVertexY + (stepSize * 1) / 3

        ctx.beginPath()
        ctx.moveTo(targetCanvasVertexX, targetCanvasVertexY + (stepSize * 2) / 3) // Arrow Body
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX + stepSize / 6, targetCanvasVertexY + stepSize / 2) // Arrow Head 1
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX - stepSize / 6, targetCanvasVertexY + stepSize / 2) // Arrow Head 2
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
        ctx.moveTo(targetCanvasVertexX - (stepSize * 2) / 3, targetCanvasVertexY) // Arrow Body
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX - stepSize / 2, targetCanvasVertexY - stepSize / 6) // Arrow Head 1
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX - stepSize / 2, targetCanvasVertexY + stepSize / 6) // Arrow Head 2
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

const initializeCircleState = (stepSize?: number): CircleState => {
  const startingPoints = generateStaringPoints()
  return {
    collisionPoints: [],
    drawnPoints: startingPoints.map(([x, y]) => [x, y]),
    indexesToClear: {},
    recursionLevel: 1,
    stepSize,
    vertexRecords: startingPoints,
  }
}

const getStepSize = (ctx: CanvasRenderingContext2D, recursionLevel: number): number =>
  Math.floor((Math.min(ctx.canvas.width, ctx.canvas.height) - 1) / (recursionLevel * 2))

interface CircleState {
  collisionPoints: Array<XY>
  drawnPoints: Array<XY>
  indexesToClear: Record<string, boolean>
  previousCircleState?: CircleState
  recursionLevel: number
  stepSize?: number
  vertexRecords: Array<VertexRecord>
}

const CpArcticCircle: React.FC<Record<string, never>> = () => {
  const canvas = useRef<HTMLCanvasElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // Common state for all the UI
  const [circleState, setCircleState] = useState<CircleState>(initializeCircleState)
  const restart = useCallback(() => {
    performance.clearMarks()
    performance.clearMeasures()
    setCircleState(initializeCircleState(circleState.stepSize))
  }, [circleState.stepSize])
  const undo = useCallback(() => {
    setCircleState((currentCircleState) =>
      currentCircleState.previousCircleState
        ? currentCircleState.previousCircleState
        : currentCircleState,
    )
  }, [])

  const [showNewPoints, setShowNewPoints] = useState<number>(1)
  const toggleShowNewPoints = useCallback(
    () => setShowNewPoints((currentHideDrawnPoints) => (currentHideDrawnPoints + 1) % 3),
    [],
  )

  const [showConflicts, setShowConflicts] = useState<number>(2)
  const toggleShowConflicts = useCallback(
    () => setShowConflicts((currentShowConflicts) => (currentShowConflicts + 1) % 3),
    [],
  )

  const toggleFixStepSize = useCallback(() => {
    const { stepSize: currentStepSize, ...remainingCircleState } = circleState
    const canvasElement = canvas.current
    if (canvasElement) {
      const ctx = canvasElement.getContext("2d")
      if (ctx) {
        if (typeof currentStepSize === "number") {
          setCircleState(remainingCircleState)
        } else {
          setCircleState({
            ...remainingCircleState,
            stepSize: getStepSize(ctx, circleState.recursionLevel),
          })
        }
      }
    }
  }, [circleState])

  // Take a single AC step
  const performStep = useCallback(
    (): Promise<void> =>
      new Promise((resolve) => {
        setCircleState((previousCircleState) => {
          const newRecursionLevel = previousCircleState.recursionLevel + 1
          const performanceMarkStart = `Started Calculations ${newRecursionLevel}}`
          performance.mark(performanceMarkStart)

          // Helper to create a non-colliding key from the recursion level
          const yValueOffset = Math.ceil(Math.log2(2 * newRecursionLevel))
          const getCollisionKey = (x: number, y: number): number => x + (y << yValueOffset)
          const generateCandidate = (x: number, y: number): { key: number; point: number[] } => ({
            key: getCollisionKey(x, y),
            point: [x, y],
          })
          const createdRecordVertecies: Record<string, XY> = {}

          const seen: Record<string, number> = {}

          // Clear Collisions from last run, and also calculate where new records will go
          const postCollisionRecords = previousCircleState.vertexRecords.filter(
            ([pointX, pointY, direction], index) => {
              // Mark the candidates for a new draw
              let generateCandidateA: { key: number; point: XY }
              let generateCandidateB: { key: number; point: XY }

              switch (direction) {
                case Direction.E:
                  generateCandidateA = generateCandidate(pointX + 1, pointY + 1)
                  generateCandidateB = generateCandidate(pointX + 1, pointY - 1)
                  break
                case Direction.N:
                  generateCandidateA = generateCandidate(pointX + 1, pointY - 1)
                  generateCandidateB = generateCandidate(pointX - 1, pointY - 1)
                  break
                case Direction.S:
                  generateCandidateA = generateCandidate(pointX + 1, pointY + 1)
                  generateCandidateB = generateCandidate(pointX - 1, pointY + 1)
                  break
                case Direction.W:
                  generateCandidateA = generateCandidate(pointX - 1, pointY + 1)
                  generateCandidateB = generateCandidate(pointX - 1, pointY - 1)
                  break
                default:
                  throw new Error("Missing direction")
              }

              // Check if either of the candidates has been seen yet, and if so clear them out
              if (seen[generateCandidateA.key]) {
                delete createdRecordVertecies[generateCandidateA.key]
              } else {
                // Save the records of the points drawn for the UI
                createdRecordVertecies[generateCandidateA.key] = generateCandidateA.point
              }

              if (seen[generateCandidateB.key]) {
                delete createdRecordVertecies[generateCandidateB.key]
              } else {
                // Save the records of the points drawn for the UI
                createdRecordVertecies[generateCandidateB.key] = generateCandidateB.point
              }

              // Mark the current node as seen
              const itemCollisionKey = getCollisionKey(pointX, pointY)
              if (createdRecordVertecies[itemCollisionKey]) {
                delete createdRecordVertecies[itemCollisionKey]
              }
              seen[itemCollisionKey] = index

              // Keep the old vertext if it wasn't in collision state
              return !previousCircleState.indexesToClear[index]
            },
          )

          const performanceMarkAfterFirstLoop = `After First Loop ${newRecursionLevel}}`
          performance.mark(performanceMarkAfterFirstLoop)

          // Perform Moves from this run
          const postMoveRecords = postCollisionRecords.map(([vertexX, vertexY, direction]) => {
            switch (direction) {
              case Direction.E:
                return [vertexX - 1, vertexY, direction]
              case Direction.N:
                return [vertexX, vertexY + 1, direction]
              case Direction.S:
                return [vertexX, vertexY - 1, direction]
              case Direction.W:
                return [vertexX + 1, vertexY, direction]
              default:
                throw new Error("Invalid Direction")
            }
          }) as Array<VertexRecord>

          const performanceMarkAfterSecondLoop = `After Second Loop ${newRecursionLevel}}`
          performance.mark(performanceMarkAfterSecondLoop)

          // // Return the generated records
          const finalRecords = [...postMoveRecords].concat(
            ...Object.values(createdRecordVertecies).map((point) => generateStaringPoints(point)),
          )

          // Find Collisions for new record set
          const potentialCollisionPoints: Array<XY> = []
          const actualCollisionPoints: Array<XY> = []
          const indexesToClear: Record<string, boolean> = {}
          const newSeen: Record<string, number> = {}

          finalRecords.forEach(([pointX, pointY], index) => {
            potentialCollisionPoints.push([pointX, pointY])

            // Store collision data for later
            const collisionKey = getCollisionKey(pointX, pointY)
            if (newSeen[collisionKey] !== undefined) {
              actualCollisionPoints.push([pointX, pointY])
              indexesToClear[newSeen[collisionKey]] = true
              indexesToClear[index] = true
            } else {
              newSeen[getCollisionKey(pointX, pointY)] = index
            }
          })

          const performanceMarkAfterThirdLoop = `After Third Loop ${newRecursionLevel}}`
          performance.mark(performanceMarkAfterThirdLoop)
          resolve()

          const performanceMarkEnd = `Finished Calculations ${newRecursionLevel}}`
          performance.mark(performanceMarkEnd)

          const measureWholeExecution = `Calculation Execution Time for ${newRecursionLevel}`
          performance.measure(measureWholeExecution, performanceMarkStart, performanceMarkEnd)

          const measureFirstLoop = `First Loop for ${newRecursionLevel}`
          performance.measure(measureFirstLoop, performanceMarkStart, performanceMarkAfterFirstLoop)

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

          const performanceEntries = [
            ...performance.getEntriesByName(measureWholeExecution),
            ...performance.getEntriesByName(measureFirstLoop),
            ...performance.getEntriesByName(measureSecondLoop),
            ...performance.getEntriesByName(measureThirdLoop),
          ]

          console.log(
            JSON.stringify({
              recursionLevel: newRecursionLevel,
              result: performanceEntries.map((measure) => ({
                [measure.name]: `${Math.round(measure.duration)}ms`,
              })),
            }),
          )

          return {
            collisionPoints: actualCollisionPoints,
            drawnPoints: Object.values(createdRecordVertecies),
            indexesToClear,
            previousCircleState,
            recursionLevel: newRecursionLevel,
            stepSize: previousCircleState.stepSize,
            vertexRecords: finalRecords,
          }
        })
      }),
    [],
  )

  // Handle looping
  const [loop, setLoop] = useState(0)
  const toggleLoop = useCallback(() => setLoop((currentLoop) => (currentLoop > 0 ? 0 : 1)), [])
  useLayoutEffect(() => {
    if (loop) {
      const timeoutId = setTimeout(() => {
        performStep().then(() => setLoop((currentLoop) => (currentLoop > 0 ? currentLoop + 1 : 0)))
      }, 10)
      return () => clearTimeout(timeoutId)
    } else {
      return
    }
  }, [loop, performStep])

  const headerElement = headerRef.current
  const headerHeight = headerElement?.clientHeight ?? 0

  const [resizeNumber, setResizeNumber] = useState(0)


  useEffect(() => {
    const update = (): void => {
      console.log("resize")
      setResizeNumber((currentResizeNumber) => currentResizeNumber + 1)
    }
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  // Render the current step
  useEffect(() => {
    // Force a redraw after resize
    resizeNumber

    const canvasElement = canvas.current
    if (canvasElement) {
      const currentRecursionLevel = circleState.recursionLevel
      const performanceMarkStart = `Started Draw ${currentRecursionLevel}`
      performance.mark(performanceMarkStart)
      const ctx = canvasElement.getContext("2d")

      if (ctx) {
        const stepSize = circleState.stepSize ?? getStepSize(ctx, circleState.recursionLevel)

        const origin: XY = [ctx.canvas.width / 2, ctx.canvas.height / 2]

        ctx.lineWidth = 1
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
        for (const vertexRecord of circleState.vertexRecords) {
          drawBox(ctx, origin, stepSize, vertexRecord)
        }

        if (circleState.collisionPoints && showConflicts !== 0) {
          circleState.collisionPoints.forEach((drawPoint) => {
            ctx.fillStyle = showConflicts === 1 ? "rgba(255,255,255,0.99)" : "rgba(0,0,0,0.9)"

            ctx.fillRect(
              origin[0] + (drawPoint[0] - 1) * stepSize,
              origin[1] + (drawPoint[1] - 1) * stepSize,
              2 * stepSize,
              2 * stepSize,
            ) // Box around conflicts
          })
        }

        // If we're going slowly, render the current candidates too
        if (circleState.drawnPoints && showNewPoints !== 0) {
          circleState.drawnPoints.forEach((drawPoint) => {
            ctx.fillStyle = showNewPoints === 1 ? "rgba(255,220,220,0.80)" : "rgba(60,60,60,0.8)"
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
          result: [{
            [latestMeasure.name]: `${Math.round(latestMeasure.duration)}ms`,
          }],
        }),
      )
    }
  }, [showNewPoints, circleState, showConflicts, resizeNumber])



  // Render some controls, and the canvas with the circle
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div ref={headerRef}>
        <div>
          <button onClick={restart}>Restart</button>
          <button onClick={performStep}>Next</button>
          <button onClick={undo}>Undo</button>
          <button onClick={toggleLoop}>Loop</button>
        </div>
        <div>
          <button onClick={toggleShowNewPoints}>
            New Records are{" "}
            {showNewPoints === 0 ? "Not Highlighted" : showNewPoints === 1 ? "Bright" : "Dark"}
          </button>
          <button onClick={toggleShowConflicts}>
            Conflicts are{" "}
            {showConflicts === 0 ? "Not Highlighted" : showConflicts === 1 ? "Bright" : "Dark"}
          </button>
          <button onClick={toggleFixStepSize}>
            Zoom Level {circleState.stepSize ? `${circleState.stepSize}px` : "Not Fixed"}
          </button>
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
