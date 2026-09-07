/**
 * Predefined CivicX skill catalogue used by the university skill profile.
 * Custom skills typed by a student are stored in exactly the same
 * `profiles.skills` text array — the catalogue is only a suggestion list.
 */

export interface SkillCategory {
  id: string;
  label: string;
  skills: string[];
}

export const skillCatalog: SkillCategory[] = [
  {
    id: "technology",
    label: "TECHNOLOGY",
    skills: [
      "Python",
      "C",
      "C++",
      "Java",
      "JavaScript",
      "TypeScript",
      "React",
      "HTML/CSS",
      "SQL",
      "AI/ML",
      "Data Science",
      "Data Analytics",
      "Computer Vision",
      "IoT",
      "Cloud Computing",
      "Cybersecurity",
    ],
  },
  {
    id: "design",
    label: "DESIGN & PRODUCT",
    skills: ["UI/UX", "Figma", "Product Design", "Prototyping"],
  },
  {
    id: "domain",
    label: "DOMAIN / RESEARCH",
    skills: [
      "Environmental Science",
      "Civil Engineering",
      "Healthcare",
      "Agriculture",
      "Urban Planning",
      "Research",
    ],
  },
  {
    id: "other",
    label: "OTHER",
    skills: [
      "Project Management",
      "Public Speaking",
      "Documentation",
      "Marketing",
      "Social Media",
    ],
  },
];

export const allCatalogSkills: string[] = skillCatalog.flatMap((c) => c.skills);

/** True when two skill labels name the same skill (case/spacing tolerant). */
export function isSameSkillLabel(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
