import Link from "next/link";
import Imgix, { Picture, Source } from "react-imgix";
import Head from "next/head";
import styles from "./about.module.scss";
import TabbedContentBox from "@/components/TabbedContentBox/tabbedcontentbox";
import ContentBoxTab from "@/components/TabbedContentBox/ContentBoxTab/contentboxtab";
import ExpBox, { ExpBoxProps } from "@/components/ExpBox/expbox";
import ExtraCurricularBox, {
  ExtraCurricularBoxProps,
} from "@/components/ExtraCurricularBox/extracurricularbox";
import projectConfig from "../public/targetProjects.json";

const aboutBlurb =
"Hi, I'm Kanwarpal, Welcome to my portfolio website. I'm a lifetime learner and aspiring software developer in my 4th year of an undergraduate Computer Science degree from the University of Waterloo. I have had the opportunity to intern at numerous software companies and interact with many industry-standard technologies, but I'm always looking for more to learn."
const resumeBlurb =
  "Take a look at my resume, and feel free to contact me with questions and opportunities of any nature.";

const workExperience: ExpBoxProps[] = [
  {
    title: "Backend Software Engineering Co-op",
    company: "Carta",
    date: "Jan 2024 - Present",
    bullets: [
      "Implemented lightweight financial report variant reducing report generation time by 12% and elevating user experience",
      "Leading the migration and optimization of report generation code using Apache POI, gRPC + Protobuf for communication, and Java concurrency functionality to speed up user experience",
    ],
  },
  {
    title: "Software Developer",
    company: "Arctic Wolf Networks",
    date: "May - Aug 2023",
    bullets: [
      "Reduced response times 25% by designing and developing a concurrent Prometheus metrics monitoring system in Go for an Apache Kafka Wrapper, contributing to a successful release",
      "Designed a reflection-based Go Test verification algorithm, identifying missing/broken metrics tests with 100% accuracy",
      "Identified, investigated, and planned fix for a REST API bug across multiple AWS microservices caused by improper adherence to OpenAPI specification",
      "Reduced lead times by designing a forwards/backwards compatible Kafka Serialization system using SchemaVer and Avro",
    ],
  },
  {
    title: "Full Stack Software Developer",
    company: "Genesys Laboratories",
    date: "Sept - Dec 2022",
    bullets: [
      "Reduced hosting costs 10% by transitioning scheduling API to serverless using Python, Flask, and AWS Lambda + SQS",
      "Developed attractive scheduling UI in a Vue.js frontend, interacting with a Kafka-based event-forwarding system",
      "Rewrote schedule state management REST API in Python + Flask + RESTX, reducing codebase size by 30%",
      "Standardized REST API Unit/Integration tests in Python by designing fixtures, decreasing future development time",
    ],
  },
  {
    title: "Software Engineering Intern",
    company: "Cloudspark Labs",
    date: "Jan - Apr 2022",
    bullets: [
      "Led ground-up design/development of RESTful and Event-Driven microservices for web apps leveraging Microsoft Azure",
      "Leveraged Azure Service Bus to develop decoupled microservices, ensuring scalability with Azure autoscale",
      "Led the development of Event-Driven Licensing, Notification, and Auth microservices for a start-up MVP launch, utilizing TypeScript, Nest.JS, CosmosDB, and Dependency Injection",
    ],
  },
  {
    title: "DevOps Specialist",
    company: "Pillar To Post",
    date: "May - Aug 2021",
    bullets: [
      "Designed and Developed an Automated Web Software Testing Framework in Selenium using Python and JavaScript, eliminating manual testing and saving 100+ company hours",
    ],
  },
];

const extraCurriculer: ExtraCurricularBoxProps[] = [
  {
    name: "Humans vs. Zombies",
    img: "uwhvz.svg",
    desc: [
      "UWaterloo Humans vs. Zombies (UWHVZ) is a club that runs week-long campus-wide games of Nerf tag between two teams: the Humans and the Zombies. It is my favorite club, combining good exercise with teamwork and strategy.",
      "As 3x Webmaster of UWHVZ, I have a hand in the development of the club website using Django, Python, HTML, CSS, and Javascript"
    ],
  },
  {
    name: "Improv Club",
    img: "improvclub.png",
    desc: [
      "UWaterloo Improv Club is, as the name implies, a club where you do improv. The club runs weekly improv game sessions, as well as guided improv tutorials. Improv Club is full of friendly and welcoming people, so it's super easy to get into.",
      "I joined improv club wanting to learn how to think on the spot better, but ended up having an amazing time and making tonnes of friends.",
    ],
  },
  {
    name: "Tea & Culture Club",
    img: "teaclub.png",
    desc: [
      "UWaterloo Tea Club is a laid-back gathering of games, socialization, and, of course, tea. They run weekly meetings in the evenings with new tea flavors every week.",
      "I love tea, and I love socializing, so Tea Club is a \"must attend\" for me. Destroying people in UNO is just a bonus."
    ],
  },
];

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
