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

export const getRandomBoolean = window.crypto ? cryptoRandom.boolean : () => Math.random() > 0.5
