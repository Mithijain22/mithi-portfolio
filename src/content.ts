// All personal content lives here. Dummy text until real content arrives.
// Nothing personal may be hard-coded anywhere else.

export interface CaseStudySection {
  heading: string;
  body: string;
  image?: string;
}

export interface Project {
  index: string;
  slug: string;
  title: string;
  annotation: string;
  outcome: string;
  role: string;
  timeline: string;
  tools: string;
  problem: string;
  approach: string;
  result: string;
  heroImage: string;
  summary: string;
  caseStudy: { sections: CaseStudySection[] };
}

export const NAME = 'MITHI';
export const TAGLINE = 'I ship products. Beat my backlog.';
export const PORTRAIT = ''; // path to posterized portrait; empty = lips fallback

// Set when a real domain exists. Empty = no canonical URLs, OG url or sitemap.
export const SITE_URL = '';

const dummySections = (): CaseStudySection[] => [
  { heading: 'Problem', body: 'DUMMY TEXT. Describe the problem here in two or three sentences.' },
  { heading: 'Approach', body: 'DUMMY TEXT. Describe what you did and why.' },
  { heading: 'Result', body: 'DUMMY TEXT. Describe what changed, with a number if possible.' },
];

export const PROJECTS: Project[] = [
  {
    index: '00_1',
    slug: 'project-one',
    title: 'PROJECT ONE',
    annotation: 'shipped in 6 weeks',
    outcome: 'DUMMY OUTCOME. One sentence with a metric.',
    role: 'Product Manager',
    timeline: '6 weeks',
    tools: 'Figma, SQL',
    problem: 'DUMMY PROBLEM. One or two sentences.',
    approach: 'DUMMY APPROACH. One or two sentences.',
    result: 'DUMMY RESULT. One or two sentences.',
    heroImage: '',
    summary: 'DUMMY SUMMARY. Two sentences for the work index. Replace later.',
    caseStudy: { sections: dummySections() },
  },
  {
    index: '00_2',
    slug: 'project-two',
    title: 'PROJECT TWO',
    annotation: 'zero to one',
    outcome: 'DUMMY OUTCOME. One sentence with a metric.',
    role: 'Product Manager',
    timeline: '3 months',
    tools: 'Notion, Mixpanel',
    problem: 'DUMMY PROBLEM. One or two sentences.',
    approach: 'DUMMY APPROACH. One or two sentences.',
    result: 'DUMMY RESULT. One or two sentences.',
    heroImage: '',
    summary: 'DUMMY SUMMARY. Two sentences for the work index. Replace later.',
    caseStudy: { sections: dummySections() },
  },
  {
    index: '00_3',
    slug: 'project-three',
    title: 'PROJECT THREE',
    annotation: 'the one that fought back',
    outcome: 'DUMMY OUTCOME. One sentence with a metric.',
    role: 'Product Manager',
    timeline: '2 months',
    tools: 'Figma, Amplitude',
    problem: 'DUMMY PROBLEM. One or two sentences.',
    approach: 'DUMMY APPROACH. One or two sentences.',
    result: 'DUMMY RESULT. One or two sentences.',
    heroImage: '',
    summary: 'DUMMY SUMMARY. Two sentences for the work index. Replace later.',
    caseStudy: { sections: dummySections() },
  },
];

export const ABOUT =
  'DUMMY ABOUT TEXT. Replace with sixty to ninety words about who you are, what you build and how you think about products.';

export const AI_BUILD_NOTE =
  'DUMMY AI BUILD NOTE. Replace with eighty to one hundred twenty words on how this site was built with AI, what worked and what broke.';

export const LINKS = {
  email: 'hello@example.com',
  linkedin: 'https://www.linkedin.com/in/your-name',
  resume: '/resume.pdf',
  github: '',
};
