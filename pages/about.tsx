import Link from "next/link";
import Imgix, { Picture, Source } from "react-imgix";
import Head from "next/head";
import styles from "./about.module.scss";
import TabbedContentBox from "@/components/TabbedContentBox/tabbedcontentbox";
import ContentBoxTab from "@/components/TabbedContentBox/ContentBoxTab/contentboxtab";
import ExpBox from "@/components/ExpBox/expbox";
import ExtraCurricularBox from "@/components/ExtraCurricularBox/extracurricularbox";
import projectConfig from "../public/targetProjects.json";
import {
  aboutBlurb,
  resumeBlurb,
  extraCurriculer,
  workExperience,
} from "@/data/about";

export default function AboutMe() {
  return (
    <div className={styles.about_container}>
      <Head>
        <title>About - Kanwarpal Brar Portfolio</title>
        <meta name="description" content={`${aboutBlurb}`} />
      </Head>
      <section className={styles.info_box}>
        <div className={styles.headshot}>
          <Picture>
            <Source
              src={`${projectConfig.repoImageUrl}/headshot.png`}
              width={250}
              htmlAttributes={{ media: "(min-width: 768px)" }}
            />
            <Source
              src={`${projectConfig.repoImageUrl}/headshot.png`}
              width={180}
              htmlAttributes={{ media: "(min-width: 350px)" }}
            />
            <Imgix
              src={`${projectConfig.repoImageUrl}/headshot.png`}
              imgixParams={{ w: 100 }}
            />
          </Picture>
        </div>
        <div className={styles.info_box_outer}>
          <div className={styles.info_box_text}>
            <h2>Kanwarpal Brar</h2>
            <p>{aboutBlurb}</p>
            <p className={styles.resume_blurb}>
              <b>{resumeBlurb}</b>
            </p>
            <Link href={"/Kanwarpal_Brar_Resume.pdf"} target="_blank">
              <button>View Resume</button>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.work_info_box}>
        <TabbedContentBox title="Work Experience" key="1">
          {workExperience.map((exp, i) => {
            return (
              <ContentBoxTab key={exp.company} name={exp.company}>
                <ExpBox {...exp} />
              </ContentBoxTab>
            );
          })}
        </TabbedContentBox>
        <TabbedContentBox title="Extra-Curriculars" key="2">
          {extraCurriculer.map((ec, i) => {
            return (
              <ContentBoxTab key={ec.name} name={ec.name}>
                <ExtraCurricularBox {...ec} />
              </ContentBoxTab>
            );
          })}
        </TabbedContentBox>
      </section>
    </div>
  );
}
