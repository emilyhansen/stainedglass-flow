declare module 'imagetracerjs' {
  interface TracerOptions {
    ltres?: number
    qtres?: number
    pathomit?: number
    colorsampling?: number
    numberofcolors?: number
    mincolorratio?: number
    blurradius?: number
    [key: string]: unknown
  }
  const ImageTracer: {
    imagedataToSVG(imageData: ImageData, options?: TracerOptions): string
    imageToSVG(url: string, callback: (svgStr: string) => void, options?: TracerOptions): void
  }
  export default ImageTracer
}
