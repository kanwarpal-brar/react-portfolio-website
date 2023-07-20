import Layout from '@/components/Layout/layout';
import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    
    <Layout>
      {/* <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
        <link href="https://fonts.googleapis.com/css2?family=Chivo+Mono:ital,wght@0,100;0,200;0,500;0,600;0,900;1,100;1,200;1,500;1,600;1,900&display=swap" rel="stylesheet"/>
      </Head> */}
      <main>
        <Component {...pageProps} />
      </main>
    </Layout>
    );
}
