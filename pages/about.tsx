import Link from "next/link"
import Image from "next/image"
import Head from "next/head"
import styles from "./about.module.scss"
import TabbedContentBox from "@/components/TabbedContentBox/tabbedcontentbox"
import ContentBoxTab from "@/components/TabbedContentBox/ContentBoxTab/contentboxtab"
import ExpBox, { ExpBoxProps } from "@/components/ExpBox/expbox"
import ExtraCurricularBox, { ExtraCurricularBoxProps } from "@/components/ExtraCurricularBox/extracurricularbox"

const aboutBlurb = "Hi, my name is Kanwarpal, welcome to my portfolio website. I'm a a lifetime learner and aspiring software developer in my 3rd year of an undergraduate Computer Science degree from the University of Waterloo. I have had the opportunity to intern at numerous software companies and interact with a of industry standard technologies, but I'm always looking for more to learn." 
const resumeBlurb = "Take a look at my resume, and feel free to contact me with questions and opportunities of any nature."

const workExperience: ExpBoxProps[] = [
    {
        title: "job 1",
        company: "My Company",
        date: "sept-oct 2023",
        bullets: ["did some stuff", "did some more stuff", "very cool stuff"]
    },
    {
        title: "job 2",
        company: "My Company2",
        date: "sept-oct 2023",
        bullets: ["did some stuff", "did some more stuff", "very cool stuff"]
    }
]

const extraCurriculer: ExtraCurricularBoxProps[] = [
    {
        name: "curricular",
        img: "/headshot.jpeg",
        desc: "This is a club I am inwdbwfjkabfawifbawkjdb wdb uawobda kjbdw awoudb oawjldb waoudb waljdb awoud wabd aod bwalj dbaw douwa"
    },
    {
        name: "curricular2",
        img: "/headshot.jpeg",
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
                <Image
                    className={styles.headshot}
                    src="/headshot.jpeg"
                    alt="Headshot of me"
                    width={250}
                    height={250}
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