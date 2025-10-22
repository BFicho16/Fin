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
}

export {};
