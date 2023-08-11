import Head from "next/head"
import styles from "./projects.module.scss"
import ExpandingProjectWidget, { ExpandingProjectWidgetProps } from "@/components/ExpandingProjectWidget/expandingprojectwidget"


const projects: ExpandingProjectWidgetProps[] = [
    {
        title: "project title",
        img: "/SMPTE_Color_Bars.svg",
        desc: "This is a description",
        link: "google.ca"
    },
    {
        title: "project title 2",
        img: "/SMPTE_Color_Bars.svg",
        desc: "This is a description",
        link: "google.ca"
    }
]


export default function Project() {
    const projectWidgets = projects.map(props => {
        return <ExpandingProjectWidget {...props}/>
    })


    return (
        <div>
            <Head>
                <title>
                    Projects
                </title>
            </Head>
            <main className={styles.projects_box}>
                {projectWidgets}
            </main>

        </div>
    )
}