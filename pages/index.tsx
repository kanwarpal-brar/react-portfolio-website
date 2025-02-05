import Link from "next/link";
import Head from "next/head";
import styles from "./index.module.scss";
import "animate.css";
import ScrambledTextIntro from "@/components/ScrambledTextIntro/scrambledtextintro";

const parablurb =
  "Software Engineer specializing in distributed systems and backend architecture. Interested in designing scalable microservices, RESTful APIs, and concurrent systems. Passionate about solving complex networking challenges and building reliable distributed applications.";

export default function Home() {
  return (
    <div>
      <Head>
        <title>Home - Kanwarpal Brar Portfolio</title>
        <meta name="description" content={`Kanwarpal Brar: ${parablurb}`} />
      </Head>

      <main className={styles.intro_box}>
        <Head>
          <title>Kanwarpal Brar</title>
        </Head>
        <h1 className={styles.title_name}>
          <ScrambledTextIntro data="Kanwarpal Brar" delayms={140} />
        </h1>
        <h3 className={styles.title_tagline}>
          <ScrambledTextIntro
            data="Developer, Researcher, Innovator"
            delayms={125}
          />
        </h3>
        <div className={styles.blurb_box}>
          <p>{parablurb}</p>
          <Link href="/Kanwarpal_Brar_Resume.pdf" target="_blank">
            <button>Resume</button>
          </Link>
          <Link rel="preload" href="/about">
            <button>About Me</button>
          </Link>
          <Link rel="preload" href="/projects">
            <button>Projects</button>
          </Link>
          <Link rel="preload" href="/cluster">
            <button>Cluster</button>
          </Link>
        </div>
      </main>
    </div>
  );
}
