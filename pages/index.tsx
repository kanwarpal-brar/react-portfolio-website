import { Inter } from 'next/font/google'
import Link from 'next/link'
import Head from 'next/head'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
      <div>
        <main>
          <Head>
            <title>Kanwarpal Brar</title>
          </Head>
          <h1>
            <Link href="/about">A</Link>
          </h1>
        </main>
      </div>
  );
}
