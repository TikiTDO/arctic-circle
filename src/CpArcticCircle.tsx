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
  // useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import CpRender from "./CpRender"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import CircleState from "./CircleState"
import computeStep, {
  // getRecursionHelpers,
  generateStaringPoints,
} from "./util/computeStep"

const initializeCircleState = (): CircleState => {
  const startingPoints = new Int16Array(2 * 3)
  generateStaringPoints(startingPoints, 0)

  const generatedXYArray = new Int16Array([
    startingPoints[0],
    startingPoints[1],
    startingPoints[3],
    startingPoints[4],
  ])

  return {
    collisionXYArray: new Int16Array(0),
    generatedXYArray,
    collisionIndexesToRemove: new Uint8Array(0),
    recursionLevel: 1,
    preCollisionRecords: startingPoints,
  }
}

const showExtras = false

const CpArcticCircle: React.FC<Record<string, never>> = () => {
  const headerRef = useRef<HTMLDivElement>(null)

  // const [fixedStepSize, setFixedStepSize] = useState<undefined | number>(
  //   undefined,
  // )

  // const getCurrentStepSize = useCallback((recursionLevel: number): number => {
  //   const canvasElement = canvas.current
  //   if (canvasElement) {
  //     const ctx = canvasElement.getContext("2d")
  //     if (ctx) {
  //       return Math.floor(
  //         (Math.min(ctx.canvas.width, ctx.canvas.height) - 1) /
  //           (recursionLevel * 2),
  //       )
  //     }
  //   }
  //   return 1
  // }, [])

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

  // Whether to highlight new conflicts (0 = no, 1 = bright, 2 = dark)
  const [saveMemory, setSaveMemory] = useState<boolean>(true)
  const toggleSaveMemory = useCallback(
    () => setSaveMemory((currentSaveMemory) => !currentSaveMemory),
    [],
  )

  // // Don't auto-zoom in and and out
  // const toggleFixStepSize = useCallback(() => {
  //   if (fixedStepSize !== undefined) {
  //     setFixedStepSize(undefined)
  //   } else {
  //     setFixedStepSize(getCurrentStepSize(circleState.recursionLevel))
  //   }
  // }, [circleState, fixedStepSize, getCurrentStepSize])

  // Set maximum zoom
  // const toggleZoomOut = useCallback(() => {
  //   setFixedStepSize(1)
  // }, [])

  // Single step functionality
  const performStep = useCallback(() => {
    setCircleState((previousCircleState) => {
      return computeStep(previousCircleState, saveMemory)
    })
  }, [saveMemory])

  // Loop Functionality
  const [loop, setLoop] = useState(0)
  const toggleLoop = useCallback(
    () => setLoop((currentLoop) => (currentLoop > 0 ? 0 : 1)),
    [],
  )
  useLayoutEffect(() => {
    if (loop) {
      const timeoutId = setTimeout(() => {
        setCircleState((previousCircleState) => {
          const nextCircleState = computeStep(previousCircleState, saveMemory)
          setLoop((currentLoop) => (currentLoop > 0 ? currentLoop + 1 : 0))
          return nextCircleState
        })
      }, 20)
      return () => clearTimeout(timeoutId)
    } else {
      return
    }
  }, [loop, saveMemory])

  // Rewind Functionality
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
      }, 20)
      return () => clearTimeout(timeoutId)
    } else {
      return
    }
  }, [loop, rewind, undo])

  const headerElement = headerRef.current
  const headerHeight = headerElement?.clientHeight ?? 0

  // Render some controls, and the canvas with the circle
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div ref={headerRef}>
        <div>
          {!rewind && !loop && <button onClick={restart}>Restart</button>}
          <button onClick={toggleSaveMemory}>
            {saveMemory ? "Enable Undo" : "Disable Undo (Saves Memory)"}
          </button>
          {!rewind && !loop && <button onClick={performStep}>Next</button>}

          {!rewind && !loop && !saveMemory && (
            <button onClick={undo}>Undo</button>
          )}
          {!loop && !saveMemory && (
            <button onClick={toggleRewind}>
              {rewind ? "Stop Rewind" : "Start Rewind"}
            </button>
          )}
          {!rewind && (
            <button
              style={{
                border: "2px solid green",
                background: loop ? "#FAA" : "#AFA",
              }}
              onClick={toggleLoop}
            >
              {loop ? "Stop Loop" : "Start Loop"}
            </button>
          )}
        </div>
        {showExtras && (
          <div>
            <>
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
              {/* <button onClick={toggleFixStepSize}>
                Zoom Level{" "}
                {fixedStepSize === undefined
                  ? "Not Fixed"
                  : `${fixedStepSize}px`}
              </button>
              <button onClick={toggleZoomOut}>Zoom Out</button> */}
            </>
          </div>
        )}
      </div>
      <CpRender
        circleState={circleState}
        headerHeight={headerHeight}
        showNewPoints={showNewPoints}
        showConflicts={showConflicts}
      />
    </div>
  )
}

export default CpArcticCircle
