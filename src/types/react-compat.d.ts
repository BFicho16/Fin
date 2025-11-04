// React 19 compatibility fix
declare global {
  namespace React {
    type ReactNode = 
      | ReactElement
      | string
      | number
      | ReactFragment
      | ReactPortal
      | boolean
      | null
      | undefined
      | bigint;
  }

  // Facebook Pixel type declarations
  interface Window {
    fbq: (
      action: 'init' | 'track',
      eventName: string,
      params?: Record<string, any>
    ) => void;
    _fbq?: typeof window.fbq;
  }
}

export {};
