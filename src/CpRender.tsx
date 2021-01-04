import React, { useEffect, useState, useRef } from "react"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import CircleState, { Direction, directionCount } from "./CircleState"
// import { getRecursionHelpers } from "./util/computeStep"
// import renderState from "./util/renderState"

const vertices = new Float32Array(2 ** 26) // Every set of 3 XYD coordinates gets 3 vergex configs
const colors = new Float32Array(2 ** 26) // Every set of 3 XYD coordinates gets 3 color configs
const indices = new Uint32Array(2 ** 26) // Every set of 3 XYD coordinates gets 6 indexes
let indexLength = 0
let vertexLength = 0

// This is 4 Sets of 7 numbers which are used to provide direction config. Ordered alphabetically by variable name.
const directionConfig = new Float32Array([
  Direction.N,
  0.5, // :blueColor
  1, // :dynamicX
  0, // :dynamicY
  0.5, // :greenColor
  1.0, // :redColor
  0, // :secondX
  -1, // :secondY
  Direction.E,
  0.5, // :blueColor
  0, // :dynamicX
  1, // :dynamicY
  1.0, // :greenColor
  0.5, // :redColor
  1, // :secondX
  0, // :secondY
  Direction.S,
  1.0, // :blueColor
  -1, // :dynamicX
  0, // :dynamicY
  0.5, // :greenColor
  0.5, // :redColor
  0, // :secondX
  1, // :secondY
  Direction.W,
  0.5, // :blueColor
  0, // :dynamicX
  -1, // :dynamicY
  0.5, // :greenColor
  0.5, // :redColor
  -1, // :secondX
  0, // :secondY
])

// The above array must have this number of entires per direction
const directionConfigSize = 8
if (directionConfig.length !== directionCount * directionConfigSize)
  throw new Error(
    `directionConfig size is wrong ${directionConfig.length} !== ${
      directionCount * directionConfigSize
    }`,
  )

const CpRender: React.FC<{
  circleState: CircleState
  headerHeight: number
  showNewPoints: number
  showConflicts: number
}> = ({ circleState, headerHeight }) => {
  const canvas = useRef<HTMLCanvasElement>(null)

  const [resizeNumber, setResizeNumber] = useState(0)

  useEffect(() => {
    const update = (): void => {
      setResizeNumber((currentResizeNumber) => currentResizeNumber + 1)
    }
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const [buffers, setBuffers] = useState<
    | undefined
    | {
        vertexBuffer: WebGLBuffer
        indexBuffer: WebGLBuffer
        colorBuffer: WebGLBuffer
      }
  >()

  useEffect(() => {
    const canvasElement = canvas.current
    // The extra condition forces a redraw after resize
    if (canvasElement && resizeNumber >= 0 && buffers) {
      const ctx = canvasElement.getContext("webgl")
      if (ctx) {
        const preCollisionRecords = circleState.preCollisionRecords

        const currentRecursionLevel = circleState.recursionLevel * 1.0
        const performanceMarkStart = `Started Draw ${currentRecursionLevel}`
        performance.mark(performanceMarkStart)

        const divisor = currentRecursionLevel

        for (let i = 0; i < preCollisionRecords.length; i = i + 3) {
          const baseIndexRecord = i * 2
          const baseVertextRecord = i * 4
          const baseVertextRecordIndex = baseVertextRecord / 3

          const pointX = preCollisionRecords[i]
          const pointY = preCollisionRecords[i + 1]

          indices[baseIndexRecord] = baseVertextRecordIndex
          indices[baseIndexRecord + 1] = baseVertextRecordIndex + 1
          indices[baseIndexRecord + 2] = baseVertextRecordIndex + 2
          indices[baseIndexRecord + 3] = baseVertextRecordIndex + 3
          indices[baseIndexRecord + 4] = baseVertextRecordIndex + 2
          indices[baseIndexRecord + 5] = baseVertextRecordIndex

          indexLength = baseIndexRecord + 6
          vertexLength = baseVertextRecord + 4 * 3

          // Reading config values for generating vertices and colors
          const directionIndex =
            preCollisionRecords[i + 2] * directionConfigSize + 1

          const blueColor = directionConfig[directionIndex]
          const dynamicX = directionConfig[directionIndex + 1]
          const dynamicY = directionConfig[directionIndex + 2]
          const greenColor = directionConfig[directionIndex + 3]
          const redColor = directionConfig[directionIndex + 4]
          const secondX = directionConfig[directionIndex + 5]
          const secondY = directionConfig[directionIndex + 6]

          // The actual generation of the vertices for this record
          let baseVertexIndex = baseVertextRecord

          vertices[baseVertexIndex] = (pointX + dynamicX) / divisor
          vertices[baseVertexIndex + 1] = (pointY + dynamicY) / divisor

          colors[baseVertexIndex] = redColor
          colors[baseVertexIndex + 1] = greenColor
          colors[baseVertexIndex + 2] = blueColor

          baseVertexIndex = baseVertexIndex + 3
          vertices[baseVertexIndex] = (pointX - dynamicX) / divisor
          vertices[baseVertexIndex + 1] = (pointY - dynamicY) / divisor

          colors[baseVertexIndex] = redColor
          colors[baseVertexIndex + 1] = greenColor
          colors[baseVertexIndex + 2] = blueColor

          baseVertexIndex = baseVertexIndex + 3
          vertices[baseVertexIndex] = (pointX - dynamicX + secondX) / divisor
          vertices[baseVertexIndex + 1] =
            (pointY - dynamicY + secondY) / divisor

          colors[baseVertexIndex] = redColor
          colors[baseVertexIndex + 1] = greenColor
          colors[baseVertexIndex + 2] = blueColor

          baseVertexIndex = baseVertexIndex + 3
          vertices[baseVertexIndex] = (dynamicX + secondX + pointX) / divisor
          vertices[baseVertexIndex + 1] =
            (dynamicY + secondY + pointY) / divisor

          colors[baseVertexIndex] = redColor
          colors[baseVertexIndex + 1] = greenColor
          colors[baseVertexIndex + 2] = blueColor
        }

        // Create an empty buffer object and store vertex data
        ctx.bindBuffer(ctx.ARRAY_BUFFER, buffers.vertexBuffer)
        ctx.bufferData(
          ctx.ARRAY_BUFFER,
          vertices.subarray(0, vertexLength),
          ctx.STATIC_DRAW,
        )

        // Create an empty buffer object and store Index data
        ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer)
        ctx.bufferData(
          ctx.ELEMENT_ARRAY_BUFFER,
          indices.subarray(0, indexLength),
          ctx.STATIC_DRAW,
        )

        // Create an empty buffer object and store color data
        ctx.bindBuffer(ctx.ARRAY_BUFFER, buffers.colorBuffer)
        ctx.bufferData(
          ctx.ARRAY_BUFFER,
          colors.subarray(0, vertexLength),
          ctx.STATIC_DRAW,
        )

        //Draw the triangle
        window.requestAnimationFrame(() => {
          ctx.drawElements(ctx.TRIANGLES, indexLength, ctx.UNSIGNED_INT, 0)
        })

        // Finish the render
        const performanceMarkEnd = `Finished Draw ${circleState.recursionLevel}}`
        performance.mark(performanceMarkEnd)

        const measureName = `Draw Time for ${circleState.recursionLevel}`
        performance.measure(
          measureName,
          performanceMarkStart,
          performanceMarkEnd,
        )
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
    }
  }, [circleState, buffers])

  // Render the current step
  useEffect(() => {
    performance.clearMarks()
    performance.clearMeasures()

    const canvasElement = canvas.current
    // The extra condition forces a redraw after resize
    if (canvasElement) {
      const ctx = canvasElement.getContext("webgl")

      if (ctx) {
        ctx.getExtension("OES_element_index_uint")

        // Create an empty buffer object and store vertex data
        const vertexBuffer = ctx.createBuffer()
        ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBuffer)
        ctx.bufferData(
          ctx.ARRAY_BUFFER,
          vertices.subarray(0, 2 * 3 * 4),
          ctx.STATIC_DRAW,
        )
        ctx.bindBuffer(ctx.ARRAY_BUFFER, null)

        // Create an empty buffer object and store Index data
        const indexBuffer = ctx.createBuffer()
        ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, indexBuffer)
        ctx.bufferData(
          ctx.ELEMENT_ARRAY_BUFFER,
          indices.subarray(0, 2 * 6),
          ctx.STATIC_DRAW,
        )
        ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null)

        // Create an empty buffer object and store color data
        const colorBuffer = ctx.createBuffer()
        ctx.bindBuffer(ctx.ARRAY_BUFFER, colorBuffer)
        ctx.bufferData(
          ctx.ARRAY_BUFFER,
          colors.subarray(0, 2 * 3 * 4),
          ctx.STATIC_DRAW,
        )

        /*======================= Shaders =======================*/

        // vertex shader source code
        const vertCode = `
          precision highp float;
          attribute vec3 coordinates;
          attribute vec3 color;
          varying vec3 vColor;
          void main(void) {
            gl_Position = vec4(coordinates, 1.0);
            vColor = color;
          }
          `

        // Create a vertex shader object
        const vertShader = ctx.createShader(ctx.VERTEX_SHADER)

        // Attach vertex shader source code
        if (vertShader) {
          ctx.shaderSource(vertShader, vertCode)

          // Compile the vertex shader
          ctx.compileShader(vertShader)
        } else {
          throw new Error(
            "const vertShader = ctx.createShader(ctx.VERTEX_SHADER)",
          )
        }

        // fragment shader source code
        const fragCode = `
          precision highp float;
          varying vec3 vColor;

          void main(void) {
            gl_FragColor = vec4(vColor, 1.);
          }
          `

        // Create fragment shader object
        const fragShader = ctx.createShader(ctx.FRAGMENT_SHADER)

        if (fragShader) {
          // Attach fragment shader source code
          ctx.shaderSource(fragShader, fragCode)

          // Compile the fragmentt shader
          ctx.compileShader(fragShader)
        } else {
          throw new Error(
            "const fragShader = ctx.createShader(ctx.FRAGMENT_SHADER)",
          )
        }

        // Create a shader program object to
        // store the combined shader program
        const shaderProgram = ctx.createProgram()

        if (shaderProgram) {
          // Attach a vertex shader
          ctx.attachShader(shaderProgram, vertShader)

          // Attach a fragment shader
          ctx.attachShader(shaderProgram, fragShader)

          // Link both the programs
          ctx.linkProgram(shaderProgram)

          // Use the combined shader program object
          ctx.useProgram(shaderProgram)

          /* ======== Associating shaders to buffer objects =======*/

          // Bind vertex buffer object
          ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBuffer)

          // Bind index buffer object
          ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, indexBuffer)

          // Get the attribute location
          const coordAttribute = ctx.getAttribLocation(
            shaderProgram,
            "coordinates",
          )

          // point an attribute to the currently bound VBO
          ctx.vertexAttribPointer(coordAttribute, 3, ctx.FLOAT, false, 0, 0)

          // Enable the attribute
          ctx.enableVertexAttribArray(coordAttribute)

          // bind the color buffer
          ctx.bindBuffer(ctx.ARRAY_BUFFER, colorBuffer)

          // get the attribute location
          const colorAttribute = ctx.getAttribLocation(shaderProgram, "color")

          // point attribute to the volor buffer object
          ctx.vertexAttribPointer(colorAttribute, 3, ctx.FLOAT, false, 0, 0)

          // enable the color attribute
          ctx.enableVertexAttribArray(colorAttribute)
        } else {
          throw new Error("const shaderProgram = ctx.createProgram()")
        }

        /*============Drawing the Quad====================*/

        // Clear the canvas
        ctx.clearColor(1.0, 1.0, 1.0, 0.9)

        // ctx.disable(ctx.CULL_FACE)
        // ctx.disable(ctx.DEPTH_TEST)
        // ctx.disable(ctx.SCISSOR_TEST)
        // ctx.disable(ctx.SAMPLE_COVERAGE)
        // Enable the depth test
        // ctx.enable(ctx.DEPTH_TEST)

        // Clear the color buffer bit
        ctx.clear(ctx.COLOR_BUFFER_BIT)

        // Set the view port
        ctx.viewport(0, 0, canvasElement.width, canvasElement.height)

        ctx.enable(ctx.BLEND)

        if (vertexBuffer && indexBuffer && colorBuffer) {
          setBuffers({
            vertexBuffer,
            indexBuffer,
            colorBuffer,
          })
        }
        // How big a box is on the canvas
        // const stepSize =
        //   fixedStepSize ?? getCurrentStepSize(circleState.recursionLevel)

        // Center coordinates of the canvas
        // const originX = ctx.canvas.width / 2
        // const originY = ctx.canvas.height / 2

        // ctx.lineWidth = 1
        // ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
        // Draw the main boxes
        // const preCollisionRecords = circleState.preCollisionRecords
        // for (let i = 0; i < preCollisionRecords.length; i = i + 3) {
        //   renderState(
        //     ctx,
        //     originX,
        //     originY,
        //     2,
        //     preCollisionRecords[i],
        //     preCollisionRecords[i + 1],
        //     preCollisionRecords[i + 2],
        //   )
        // }

        // const {
        //   dataSize,
        //   getCollisionKey,
        //   getXFromCollisionKey,
        //   getYFromCollisionKey,
        // } = getRecursionHelpers(circleState.recursionLevel)

        // // TODO: Move into calculate
        // const extraBoxes = new Uint8Array(dataSize)

        // // Set 1 for every conflict box
        // if (showConflicts) {
        //   const collisionXYArray = circleState.collisionXYArray
        //   for (
        //     let collisionIndex = 0;
        //     collisionIndex < collisionXYArray.length;
        //     collisionIndex = collisionIndex + 2
        //   ) {
        //     const pointX = collisionXYArray[collisionIndex]
        //     const pointY = collisionXYArray[collisionIndex + 1]

        //     // This points has a collision
        //     extraBoxes[getCollisionKey(pointX, pointY)] |= 3 // 1 | 2

        //     // These points may itersect with a collision
        //     extraBoxes[getCollisionKey(pointX + 1, pointY)] |= 2
        //     extraBoxes[getCollisionKey(pointX - 1, pointY)] |= 2
        //     extraBoxes[getCollisionKey(pointX, pointY + 1)] |= 2
        //     extraBoxes[getCollisionKey(pointX, pointY - 1)] |= 2
        //   }
        // }

        // // Set 2 for every generated box
        // if (showNewPoints) {
        //   const generatedXYArray = circleState.generatedXYArray
        //   for (
        //     let generatedIndex = 0;
        //     generatedIndex < generatedXYArray.length;
        //     generatedIndex = generatedIndex + 2
        //   ) {
        //     const pointX = generatedXYArray[generatedIndex]
        //     const pointY = generatedXYArray[generatedIndex + 1]

        //     // This points have a new record
        //     extraBoxes[getCollisionKey(pointX, pointY)] |= 12 // 4 | 8

        //     // These points may itersect with a new
        //     extraBoxes[getCollisionKey(pointX + 1, pointY)] |= 8
        //     extraBoxes[getCollisionKey(pointX - 1, pointY)] |= 8
        //     extraBoxes[getCollisionKey(pointX, pointY + 1)] |= 8
        //     extraBoxes[getCollisionKey(pointX, pointY - 1)] |= 8
        //   }
        // }

        // // Draw all the generated boxes
        // for (let i = 0; i < extraBoxes.length; i++) {
        //   const extraBoxRecord = extraBoxes[i]
        //   if (!extraBoxRecord) {
        //     continue
        //   } else {
        //     const pointX = getXFromCollisionKey(i)
        //     const pointY = getYFromCollisionKey(i)

        //     if (extraBoxRecord === 3) {
        //       // Show box for only conflicts
        //       ctx.fillStyle =
        //         showConflicts === 1 ? "rgba(255,0,0,0.95)" : "rgba(60,0,0,0.7)"
        //     } else if (extraBoxRecord === 12) {
        //       // Show box for only generated
        //       ctx.fillStyle =
        //         showNewPoints === 1
        //           ? "rgba(255,255,255,0.95)"
        //           : "rgba(0,60,0,0.7)"
        //     } else if ((extraBoxRecord & 4) | (extraBoxRecord & 1)) {
        //       if (showConflicts === 1 && showNewPoints === 1) {
        //         // Both want bright
        //         ctx.fillStyle = "#9d1fb6"
        //       } else if (
        //         (showConflicts === 1 && showNewPoints === 2) ||
        //         (showConflicts === 2 && showNewPoints === 1)
        //       ) {
        //         // Both can't decide
        //         ctx.fillStyle = "#9d1fb6"
        //       } else {
        //         // Both want dark
        //         ctx.fillStyle = "#FFF"
        //       }
        //     } else {
        //       continue
        //     }

        //     const stepSize = 0
        //     ctx.fillRect(
        //       originX + (pointX - 1) * stepSize,
        //       originY + (pointY - 1) * stepSize,
        //       2 * stepSize,
        //       2 * stepSize,
        //     ) // Extra box
        //   }
        // }
      }
    }
  }, [])

  const minWidth = Math.min(window.outerWidth, window.innerWidth)
  const minHeight =
    Math.min(window.outerHeight, window.innerHeight) - headerHeight

  return (
    <canvas
      height={Math.min(minWidth, minHeight)}
      ref={canvas}
      style={{
        objectFit: "contain",
      }}
      width={Math.min(minWidth, minHeight)}
    />
  )
}

export default CpRender
