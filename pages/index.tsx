import Link from "next/link";
import Head from "next/head";
import styles from "./index.module.scss";
import SplitText from "@/components/SplitText/splittext";
import "animate.css";
import ScrambledTextIntro from "@/components/ScrambledTextIntro/scrambledtextintro";

const parablurb =
  "Experienced full-stack developer and student with a focus on backend, specializing in designing and implementing RESTful and Event-Driven Microservices. Committed to continuous learning and expanding my expertise.";

export default function Home() {
  return (
    <div>
      <main className={styles.intro_box}>
        <Head>
          <title>Kanwarpal Brar</title>
        </Head>
        <h1 className={styles.title_name}>
          <ScrambledTextIntro data="Kanwarpal Brar" delayms={150} />
        </h1>
        <h3 className={styles.title_tagline}>
          <ScrambledTextIntro
            data="Developer, Student, Innovator"
            delayms={125}
          />
        </h3>
        <div className={styles.blurb_box}>
          <p>{parablurb}</p>
          <Link href="/Kanwarpal_Brar_Resume.pdf" target="_blank">
            <button>Resume</button>
          </Link>
          <Link href="/about">
            <button>About Me</button>
          </Link>
          <Link href="/projects">
            <button>Projects</button>
          </Link>
        </div>
      </main>
    </div>
  );
}
