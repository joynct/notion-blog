import type { AppProps } from 'next/app'
import Script from 'next/script'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import 'katex/dist/katex.min.css'
import '../styles/global.css'
import Header from '../components/Header'
import Footer from '../components/Footer'
import site from '../../site.config'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const gaId = site.googleAnalyticsId

  // Conta as visualizações quando a pessoa navega entre páginas sem recarregar
  useEffect(() => {
    if (!gaId) return
    const onRoute = (url: string) => window.gtag?.('config', gaId, { page_path: url })
    router.events.on('routeChangeComplete', onRoute)
    return () => router.events.off('routeChangeComplete', onRoute)
  }, [router.events, gaId])

  return (
    <>
      {gaId && (
        <>
          <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
          </Script>
        </>
      )}
      <Header />
      <main>
        <Component {...pageProps} />
      </main>
      <Footer />
    </>
  )
}
