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
    },
    {
        title: "project title 3",
        img: "/SMPTE_Color_Bars.svg",
        desc: "This is a description",
        link: "google.ca"
    }
]


export default function Project() {
    const maxWidgetPerRow = 3
    const widthByHeight = 16 / 10
    const maxWidgetHeight = 30 // At most a widget should be 60vh tall

    function calculateWidgetSize() {
        const height = maxWidgetHeight / (Math.ceil(projects.length / maxWidgetPerRow))
        const width = widthByHeight * height

        return {height: `${height}vh`, width: `${width}vh`}
    }


    const projectWidgets = projects.map(props => {
        const styleData = calculateWidgetSize()
        return <ExpandingProjectWidget {...props} style={styleData} />
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