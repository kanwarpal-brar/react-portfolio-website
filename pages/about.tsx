import Link from "next/link"
import Image from "next/image"
import Head from "next/head"
import styles from "./about.module.scss"
import TabbedContentBox from "@/components/TabbedContentBox/tabbedcontentbox"
import ContentBoxTab from "@/components/TabbedContentBox/ContentBoxTab/contentboxtab"
import ExpBox, { ExpBoxProps } from "@/components/ExpBox/expbox"

const aboutBlurb = "ok"

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


export default function AboutMe() {
    return (
        <div className={styles.about_container}>
            <Head>
                <title>
                    Kanwarpal Brar
                </title>
            </Head>
            <div className={styles.info_box}>
                <Image
                    className={styles.headshot}
                    src="/headshot.jpeg"
                    alt="Headshot of me"
                    width={200}
                    height={200}
                />
                <div className={styles.info_box_text}>
                    <h2>AAAAAAAAA</h2>
                    <p>{aboutBlurb}</p>
                </div>
                <Link href={"/Kanwarpal_Brar_Resume.pdf"} target="_blank"><button>View Resume</button></Link>
            </div>

            <div className={styles.work_info_box}>
                <TabbedContentBox>
                    {workExperience.map((exp, i) => {
                        return (
                            <ContentBoxTab name={exp.company}>
                                <ExpBox {...exp}/>
                            </ContentBoxTab>
                        )
                    })}
                </TabbedContentBox>
            </div>
            
        </div>
    )
}