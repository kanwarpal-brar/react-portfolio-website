import Layout from '@/components/Layout/layout';
import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import { Chivo_Mono } from 'next/font/google';

const chivoMono = Chivo_Mono({ subsets: ['latin'] })

export default function App({ Component, pageProps }: AppProps) {
  return (
    
    <Layout>
      <main className={chivoMono.className}>
        <Component {...pageProps} />
      </main>
    </Layout>
    );
}
