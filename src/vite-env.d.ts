/// <reference types="vite/client" />

// Image imports
declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}

declare global {
  interface Window {
    /** Injected by Vite define during dev/build */
    __VITE_GOOGLE_MAPS_API_KEY__?: string
    /** Injected by Vite define during dev/build (used by PasswordGate) */
    __VITE_SITE_PASSWORD__?: string

    /** Google Maps JS attaches itself here */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any
  }
}

export {}
