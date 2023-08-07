import Link from "next/link"
import Image from "next/image"
import Head from "next/head"
import styles from "./about.module.scss"
import TabbedContentBox from "@/components/TabbedContentBox/tabbedcontentbox"
import ContentBoxTab from "@/components/TabbedContentBox/ContentBoxTab/contentboxtab"

const aboutBlurb = "ok"

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
                    <h2>Kanwarpal Brar</h2>
                    <p>{aboutBlurb}</p>
                </div>
                <button>Download Resume</button>
            </div>

            <div className={styles.work_info_box}>
                <TabbedContentBox>
                    <ContentBoxTab name="tab1">
                        <div>
                            <h1>My Title</h1>
                            <h2>My Second</h2>
                            <p>words words words worwdmwad w wdfwadn nwad nwakd naiw dnai d</p>
                        </div>
                    </ContentBoxTab>
                    <ContentBoxTab name="tab2">
                        ok2
                    </ContentBoxTab>
                </TabbedContentBox>
            </div>
            
        </div>
    )
}