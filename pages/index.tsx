import { Inter } from 'next/font/google'
import Link from 'next/link'
import Head from 'next/head'
import styles from './index.module.scss'
import SplitText from '@/components/SplitText/splittext'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
      <div>
        <main className={styles.intro_box}>
          <Head>
            <title>Kanwarpal Brar</title>
          </Head>
          <SplitText childStyle={styles.title_name} letterWrapper='h1'>
            Kanwarpal &ensp; Brar
          </SplitText>
          <h3 className={styles.title_tagline}>Developer, Student, Innovator</h3>
          <div className={styles.blurb_box}>
            <p>Experienced full-stack developer and student with a focus on backend, specializing in designing and implementing RESTful and Event-Driven Microservices. Committed to continuous learning and expanding my expertise.</p>
            <Link href="/about"><button>Resume</button></Link>
            <Link href="/about"><button>About Me</button></Link>
            <Link href="/projects"><button>Projects</button></Link>
          </div>
        </main>
      </div>
  );
}
