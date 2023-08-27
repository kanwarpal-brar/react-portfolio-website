import Link from "next/link"
import Imgix from "react-imgix"
import Head from "next/head"
import styles from "./about.module.scss"
import TabbedContentBox from "@/components/TabbedContentBox/tabbedcontentbox"
import ContentBoxTab from "@/components/TabbedContentBox/ContentBoxTab/contentboxtab"
import ExpBox, { ExpBoxProps } from "@/components/ExpBox/expbox"
import ExtraCurricularBox, { ExtraCurricularBoxProps } from "@/components/ExtraCurricularBox/extracurricularbox"
import projectConfig from "../public/targetProjects.json"

const aboutBlurb = "Hi, my name is Kanwarpal, welcome to my portfolio website. I'm a a lifetime learner and aspiring software developer in my 3rd year of an undergraduate Computer Science degree from the University of Waterloo. I have had the opportunity to intern at numerous software companies and interact with a of industry standard technologies, but I'm always looking for more to learn." 
const resumeBlurb = "Take a look at my resume, and feel free to contact me with questions and opportunities of any nature."

const workExperience: ExpBoxProps[] = [
    {
        title: "Full Stack Software Developer",
        company: "Genesys Laboratories",
        date: "Sept - Dec 2022",
        bullets: [
            "Demonstrated exceptional skill with AWS technologies such as CloudFormation, DynamoDB, Lambda, EC2, SNS, and SQS", 
            "Developed Event-Driven Microservices using Apache Kafka",
            "Built elegant REST APIs using Python & Flask",
            "Designed attractive and user-friendly UI with Vue.js",
            "Developed robust microservices for a massive web platform based on AWS using Python, Java, and Kotlin to provide functionality to hundreds of thousands of users internationally"
        ]
    },
    {
        title: "Software Engineering Intern",
        company: "Creospark/Cloudspark Labs",
        date: "Jan - Apr 2022",
        bullets: [
            "Designed and developed scalable RESTful and Event-Driven microservices for web apps leveraging Microsoft Azure",
            "Implemented numerous core microservices in TypeScript using Nest.JS, CosmosDB, and Microsoft Graph to add features",
            "Independently led design and development of claims-based authorization, licensing, and notification systems"
        ]
    },
    {
        title: "DevOps Specialist",
        company: "Pillar To Post",
        date: "May - Aug 2021",
        bullets: [
            "Designed and Developed an Automated Web Software Testing Framework in Selenium using Python and JavaScript",
            "Saved hundreds of company hours by automating regression testing suite and eliminating manual testing"
        ]
    }
]

const extraCurriculer: ExtraCurricularBoxProps[] = [
    {
        name: "Humans vs. Zombies",
        img: "uwhvz.svg",
        desc: [
            "UWaterloo Humans vs. Zombies (UWHVZ) is a club that runs week-long campus-wide games of nerf tag between two teams: the Humans and the Zombies. It is my favourite club, combining good exercise with teamwork and strategy. ",
            "As 3x Webmaster of UWHVZ I have a hand in the development of the club website using Django, Python, HTML, CSS, and Javascript"
        ]
    },
    {
        name: "Improv Club",
        img: "improvclub.png",
        desc: "This is a club I am in"
    },
    {
        name: "Tea & Culture Club",
        img: "teaclub.png",
        desc: "This is a club I am in"
    }
]


export default function AboutMe() {
    return (
        <div className={styles.about_container}>
            <Head>
                <title>
                    About: Kanwarpal Brar
                </title>
            </Head>
            <section className={styles.info_box}>
                <Imgix
                    className={styles.headshot}
                    src={`${projectConfig.repoImageUrl}/headshot.png`}
                    sizes="16vw"
                />
                <div className={styles.info_box_outer}>
                    <div className={styles.info_box_text}>
                        <h2>Kanwarpal Brar</h2>
                        <p>{aboutBlurb}</p>
                        <p className={styles.resume_blurb}><b>{resumeBlurb}</b></p>
                        <Link href={"/Kanwarpal_Brar_Resume.pdf"} target="_blank"><button>View Resume</button></Link>
                    </div>
                </div>
            </section>

            <section className={styles.work_info_box}>
                <TabbedContentBox title="Work Experience" key="1">
                    {workExperience.map((exp, i) => {
                        return (
                            <ContentBoxTab key={exp.company} name={exp.company}>
                                <ExpBox {...exp}/>
                            </ContentBoxTab>
                        )
                    })}
                </TabbedContentBox>
                <TabbedContentBox title="Extra-Curriculars" key="2">
                    {extraCurriculer.map((ec, i) => {
                        return (
                            <ContentBoxTab key={ec.name} name={ec.name}>
                                <ExtraCurricularBox {...ec}/>
                            </ContentBoxTab>
                        )
                    })}
                </TabbedContentBox>
            </section>
        </div>
    )
}