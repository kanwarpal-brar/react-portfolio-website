import Layout from "@/components/Layout/layout";
import "@/styles/globals.scss";
import type { AppProps } from "next/app";
import { Chivo_Mono } from "next/font/google";
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import * as gtag from '../lib/gtag'

const chivoMono = Chivo_Mono({ subsets: ["latin"] });

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gtag.pageview(url)
    }

    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <Layout>
      <main className={chivoMono.className}>
        <Component {...pageProps} />
      </main>
    </Layout>
  );
}
