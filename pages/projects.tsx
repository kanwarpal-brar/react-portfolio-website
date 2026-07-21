import Head from "next/head";
import type { GetStaticProps } from "next";
import styles from "./projects.module.scss";
import ExpandingProjectWidget, {
  ExpandingProjectWidgetProps,
} from "@/components/ExpandingProjectWidget/expandingprojectwidget";
import projectConfig from "../public/targetProjects.json";

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  tags_url: string;
  languages_url: string;
  archived: boolean;
  disabled: boolean;
  stargazers_url: string;
  stargazers_number: number;
  owner: GithubRepoOwner;
  topics: string[];
};

type GithubRepoOwner = {
  login: string;
};

type ProjectProps = {
  projects: ExpandingProjectWidgetProps[];
};

export const getStaticProps: GetStaticProps<ProjectProps> = async () => {
  const data: GithubRepo[] = await fetch(projectConfig.targetUrl).then(
    async (r) => await r.json(),
  );
  const projects = data
    .filter((proj: GithubRepo) =>
      projectConfig.targetProjectIds.includes(proj.id),
    )
    .map((proj: GithubRepo) => {
      return {
        title: proj.name,
        desc: proj.description ?? "",
        link: proj.html_url,
        tags: proj.topics,
      };
    });

  return { props: { projects } };
};

export default function Project({ projects }: ProjectProps) {
  const projectWidgets = projects.map((props) => {
    return <ExpandingProjectWidget {...props} key={props.title} />;
  });
  return (
    <div>
      <Head>
        <title>Projects - Kanwarpal Brar Portfolio</title>
        <meta name="description" content="Kanwarpal Brar Github Projects" />
      </Head>
      <main className={styles.projects_box}>
        <div className={styles.widgets_box}>{projectWidgets}</div>
      </main>
    </div>
  );
}
