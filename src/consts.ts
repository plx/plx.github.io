import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Dispatches",
  EMAIL: "plxgithub@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_BRIEFS_ON_HOMEPAGE: 3,
  NUM_PROJECTS_ON_HOMEPAGE: 0,
};

export const HOME: Metadata = {
  TITLE: "Dispatches",
  DESCRIPTION: "Astro Nano is a minimal and lightweight blog and portfolio.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "Longer-form articles on technical topics.",
};

export const BRIEFS: Metadata = {
  TITLE: "Briefs",
  DESCRIPTION: "Brief notes on various topics.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION: "A collection of my projects, with links to repositories and demos.",
};

export const SOCIALS: Socials = [
  { 
    NAME: "github",
    HREF: "https://github.com/plx"
  },
  { 
    NAME: "linkedin",
    HREF: "https://www.linkedin.com/in/paul-r-berman/",
  }
];
