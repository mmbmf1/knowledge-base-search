import { pipeline } from '@huggingface/transformers'

// Use the Singleton pattern to enable lazy construction of the pipeline.
// Wrap the class in a function to prevent code duplication
const P = () =>
  class PipelineSingleton {
    static task = 'feature-extraction'
    static model = 'Xenova/all-MiniLM-L6-v2'
    static instance: any = null

    static async getInstance() {
      if (this.instance === null) {
        this.instance = pipeline(this.task as any, this.model)
      }
      return this.instance
    }
  }

// Preserve pipeline instance in development to survive hot reloads
let PipelineSingleton: ReturnType<typeof P>
if (process.env.NODE_ENV !== 'production') {
  if (!global.PipelineSingleton) {
    global.PipelineSingleton = P()
  }
  PipelineSingleton = global.PipelineSingleton
} else {
  PipelineSingleton = P()
}

// Extend global type for TypeScript
declare global {
  var PipelineSingleton: ReturnType<typeof P>
}

/**
 * Generate embedding vector for given text
 * @param text - Input text to generate embedding for
 * @returns Promise resolving to 384-dimensional vector array
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await PipelineSingleton.getInstance()
  const output = await extractor(text, { pooling: 'mean', normalize: true })

  // Simplified extraction - assumes output.data is the tensor data
  const tensorData = (output as any).data
  const embedding = Array.from(tensorData)

  // Validate and convert to numbers
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('Failed to extract embedding vector')
  }

  return embedding.map((v) => Number(v))
}
