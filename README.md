# Kanwarpal Brar Portfolio

Personal portfolio for `kanwarpal.com`, built with the Next.js pages router, TypeScript, SCSS modules, Tailwind, Imgix-backed assets, and a small amount of GitHub API data.

## Getting Started

Install dependencies and start the local development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `pages/` contains the route entry points for home, about, projects, and cluster pages.
- `components/` contains reusable UI pieces such as the sidebar, tabbed content boxes, experience cards, and project widgets.
- `data/about.tsx` is the source of truth for the about page biography, education, work experience, and extracurricular entries.
- `public/targetProjects.json` defines the GitHub repositories and asset endpoints used by the projects page.
- `styles/_variables.scss` and `styles/globals.scss` define the shared palette and global type scale.

## Data And Content

Experience and education copy should track the current resume. Update `data/about.tsx` when resume content changes, then verify `/about` against `public/Kanwarpal_Brar_Resume.pdf`.

The projects page is statically generated from the configured GitHub repositories at build time. Repository images are served through the Imgix endpoint in `public/targetProjects.json`.

## Useful Commands

```bash
yarn dev
yarn lint
yarn build
```

## Deployment

The production site is deployed for `kanwarpal.com`. Before deploying, run `yarn lint` and `yarn build`, then manually check `/`, `/about`, `/projects`, and `/cluster` in both desktop and mobile layouts.

The `CNAME` file keeps the custom domain configured for static hosting workflows that read it.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
