// types/global.d.ts
export {}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }

  function gtag(...args: any[]): void
  var dataLayer: any[]
}
