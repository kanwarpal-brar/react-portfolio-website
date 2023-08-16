import { NextApiRequest, NextApiResponse } from "next";
import data from "./targetProjects.json"

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method == "GET") {
        console.log("Made Github Get Request")
        let allRepos = await fetch("/api/mockgithub.json")
        allRepos = await allRepos.json()
        if ("message" in allRepos) {
            // Got rate limited
            res.status(429)
        }
        const projects = await Promise.all(
            allRepos
                .filter(repo => data.targetProjectIds.includes(repo.id))
                .map(async (repo) => {
                    const tags: string[] = await fetch(repo.tags_url).then(r => r.json())
                    const langs: string[] = await fetch(repo.languages_url).then(r => r.json())
                    return {
                        title: repo.name,
                        link: repo.html_url,
                        desc: repo.description,
                        tags: langs.concat(tags)
                    }
                }))
        res.status(200).json(projects)
    }
    res.status(405)  // Only supports GET requests
}