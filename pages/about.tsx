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
"Hi, I'm Kanwarpal, Welcome to my portfolio website. I'm a lifetime learner and aspiring software developer in my 3rd year of an undergraduate Computer Science degree from the University of Waterloo. I have had the opportunity to intern at numerous software companies and interact with many industry-standard technologies, but I'm always looking for more to learn."
const resumeBlurb =
  "Take a look at my resume, and feel free to contact me with questions and opportunities of any nature.";

const workExperience: ExpBoxProps[] = [
  {
    title: "Software Developer",
    company: "Arctic Wolf Networks",
    date: "May - Aug 2023",
    bullets: [
      "Developed a concurrency-safe Prometheus metrics monitoring system in Go for a custom Apache Kafka wrapper",
      "Played a pivotal role in the v1.0.0 release of a Golang Apache Kafka wrapper, decoupling systems organization-wide",
      "Spearheaded design & development of Subscriber & Deserializer systems for in-house Python Kafka wrapper",
      "Implemented custom Subscriber & Deserializer interface logic based on Apache Avro Schema versions",
      "Developed REST APIs for numerous AWS microservices in Python and Go, adhering to OpenAPI specification",
    ],
  },
  {
    title: "Full Stack Software Developer",
    company: "Genesys Laboratories",
    date: "Sept - Dec 2022",
    bullets: [
      "Demonstrated exceptional skill with AWS technologies like CloudFormation, DynamoDB, Lambda, EC2, SNS, and SQS",
      "Developed Event-Driven Microservices using Apache Kafka",
      "Reduced codebase size by 25% by transitioning to Serverless REST APIs using Python, Flask, and AWS Lambda",
      "Designed attractive and user-friendly UI with Vue.js",
      "Developed robust microservices for a massive web platform based on AWS using Python, Java, and Kotlin to provide functionality to hundreds of thousands of users internationally",
    ],
  },
  {
    title: "Software Engineering Intern",
    company: "Creospark/Cloudspark Labs",
    date: "Jan - Apr 2022",
    bullets: [
      "Designed and developed scalable RESTful and Event-Driven microservices for web apps leveraging Microsoft Azure",
      "Developed core microservices in TypeScript using Nest.JS, CosmosDB, Microsoft Graph, and Dependency Injection",
      "Led ground-up design and development of claims-based Authorization, Licensing, and Notification systems for MVP",
    ],
  },
  {
    title: "DevOps Specialist",
    company: "Pillar To Post",
    date: "May - Aug 2021",
    bullets: [
      "Designed and Developed an Automated Web Software Testing Framework in Selenium using Python and JavaScript",
      "Saved hundreds of company hours by automating regression testing suite and eliminating manual testing",
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
