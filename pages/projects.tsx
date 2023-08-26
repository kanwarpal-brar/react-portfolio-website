import Head from "next/head"
import styles from "./projects.module.scss"
import ExpandingProjectWidget, { ExpandingProjectWidgetProps } from "@/components/ExpandingProjectWidget/expandingprojectwidget"
import { useEffect, useState } from "react"
import projectConfig from "../public/targetProjects.json"

// const projects: ExpandingProjectWidgetProps[] = [
//     {
//         title: "project title",
//         img: "/SMPTE_Color_Bars.svg",
//         desc: "This is a description",
//         link: "google.ca",
//         tags: ["css", "html", "react", "next.js", "ok", "ok", "ok", "ok"]
//     },
//     {
//         title: "project title 2",
//         img: "/SMPTE_Color_Bars.svg",
//         desc: "This is a description",
//         link: "google.ca",
//         tags: ["css", "html", "react", "next.js"]
//     },
//     {
//         title: "project title 3",
//         img: "/SMPTE_Color_Bars.svg",
//         desc: "This is a description",
//         link: "google.ca",
//         tags: ["css", "html", "react", "next.js"]
//     },
//     {
//         title: "project title 4",
//         img: "/SMPTE_Color_Bars.svg",
//         desc: "This is a description",
//         link: "google.ca"
//     },
//     {
//         title: "project title 5",
//         img: "/SMPTE_Color_Bars.svg",
//         desc: "This is a description",
//         link: "google.ca"
//     },

//     {
//         title: "project title 3",
//         img: "/SMPTE_Color_Bars.svg",
//         desc: "This is a description",
//         link: "google.ca",
//         tags: ["css", "html", "react", "next.js"]
//     },
//     {
//         title: "project title 4",
//         img: "/SMPTE_Color_Bars.svg",
//         desc: "This is a description",
//         link: "google.ca",
//         tags: ["css", "html", "react", "next.js"]
//     },
//     {
//         title: "project title 5",
//         img: "/SMPTE_Color_Bars.svg",
//         desc: "This is a description",
//         link: "google.ca"
//     },
// ]

export type GithubRepo = {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string;
    private: boolean;
    tags_url: string;
    languages_url: string;
    archived: boolean;
    disabled: boolean;
    stargazers_url: string;
    stargazers_number: number;
    owner: GithubRepoOwner;
    topics: string[]
}

type GithubRepoOwner = {
    login: string;
}


export default function Project() {
    const [projects, setProjects] = useState<ExpandingProjectWidgetProps[]>([])

    useEffect(() => {
        const fetchData = async () => {
            const data: GithubRepo[] = await fetch(projectConfig.targetUrl).then( async (r) => await r.json())
            setProjects(
                data.filter((proj: GithubRepo) => projectConfig.targetProjectIds.includes(proj.id))
                    .map((proj: GithubRepo) => {
                        return {
                            title: proj.name,
                            desc: proj.description,
                            link: proj.html_url,
                            tags: proj.topics
                        }
                    })
            )
        }
        fetchData()
    }, [])
    const projectWidgets = projects.map(props => {
        return <ExpandingProjectWidget {...props} key={props.title}/>
    })
    return (
        <div>
            <Head>
                <title>
                    Projects
                </title>
            </Head>
            <main className={styles.projects_box}>
                <div className={styles.widgets_box}>
                    {projectWidgets}
                </div>
            </main>

        </div>
    )
}