export type DepartmentCode = "LEO" | "SAFD" | "SAEMS" | "DISPATCH" | "CIV";

export type DepartmentAccent = "blue" | "red" | "amber";

export interface DepartmentImage {
  src: string;
  alt: string;
}

const LAW_ENFORCEMENT_IMAGE: DepartmentImage = {
  src: "/nbt-gallery-02.jpg",
  alt: "A San Andreas police patrol vehicle responding on a rural highway",
};

const EMERGENCY_RESPONSE_IMAGE: DepartmentImage = {
  src: "/nbt-gallery-08.webp",
  alt: "A San Andreas Fire and Rescue vehicle at a rural response scene",
};

export function getDepartmentImage(code: DepartmentCode): DepartmentImage {
  switch (code) {
    case "LEO":
      return LAW_ENFORCEMENT_IMAGE;
    case "DISPATCH":
      return {
        src: "/nbt-gallery-05.webp",
        alt: "Police and fire units coordinating at a multi-agency scene",
      };
    case "SAEMS":
      return {
        src: "/nbt-gallery-01.webp",
        alt: "Fire chief and responder coordinating beside a marked response vehicle",
      };
    case "CIV":
      return {
        src: "/nbt-gallery-03.webp",
        alt: "Two residents meeting beside a vehicle in San Andreas",
      };
    case "SAFD":
      return EMERGENCY_RESPONSE_IMAGE;
  }
}

export interface DepartmentInfo {
  code: DepartmentCode;
  slug: string;
  name: string;
  summary: string;
  features: string[];
  accent: DepartmentAccent;
  externalSiteUrl?: string;
  // Only publish these details after department staff have confirmed them.
  ranks: string[];
  requirements: string[];
  // Optional grouped roster of real in-universe agencies this one
  // recruitment page stands in for (e.g. LEO covers many state/local
  // agencies through a single application) - rendered on the department
  // detail page when present.
  agencyGroups?: { heading: string; agencies: string[] }[];
}

export const DEFAULT_DEPARTMENTS: DepartmentInfo[] = [
  {
    code: "LEO",
    slug: "leo",
    name: "Law Enforcement (LEO)",
    summary: "One recruitment page covering all of San Andreas' law enforcement agencies - patrol, investigations, and tactical response.",
    features: ["Multiple LEO agencies, one application", "Patrol & investigations", "Structured rank progression"],
    accent: "blue",
    ranks: [],
    requirements: [],
    agencyGroups: [
      {
        heading: "State Agencies",
        agencies: [
          "San Andreas District Court",
          "SA Attorney General's Office",
          "SA Dept of Law Enforcement (SADLE)",
          "SADLE Criminal Investigation Division",
          "SADLE State Trooper",
          "SADLE State Emergency Response Team",
          "SADLE Dept of Coroner",
          "San Andreas Department of Public Safety (SADPS)",
          "SADPS Dept of Revenue",
          "SADPS State Trooper Division",
          "San Andreas Department of Transportation",
          "San Andreas State Prison Authority",
          "State Constable Division",
          "State Game Warden Division",
          "State Ranger Division",
        ],
      },
      {
        heading: "Local Agencies",
        agencies: [
          "Blaine County Sheriff's Office",
          "Senora Valley Police Department",
          "Paleto Bay Police Department",
          "Grapeseed Township Police Department",
          "Los Santos Sheriff's Department",
          "Los Santos Police Department",
        ],
      },
    ],
  },
  {
    code: "SAFD",
    slug: "safd",
    name: "San Andreas Fire & Rescue Services (SAFD)",
    summary: "Fire, EMS, and dispatch operations covering emergency response, medical support, and coordinated incident command.",
    features: ["Fire & rescue response", "EMS support operations", "Dispatch & incident coordination"],
    accent: "red",
    externalSiteUrl: "https://fire.nbt.gg",
    ranks: [],
    requirements: [],
  },
  {
    code: "DISPATCH",
    slug: "dispatch",
    name: "San Andreas Dispatch",
    summary: "Regional communications, radio operations, and dispatch coordination for emergency services.",
    features: ["Regional emergency dispatch", "Radio & call handling", "Multi-agency coordination"],
    accent: "blue",
    ranks: [],
    requirements: [],
  },
  {
    code: "CIV",
    slug: "civ",
    name: "San Andreas Civilian Community",
    summary: "Civilian life, community support, and non-emergency public engagement across the state.",
    features: ["Civilian roleplay", "Community engagement", "Non-emergency support"],
    accent: "amber",
    ranks: [],
    requirements: [],
  },
];

export const DEPARTMENTS_STORAGE_KEY = "nbt-admin-departments";

export function getStoredDepartments(): DepartmentInfo[] {
  if (typeof window === "undefined") {
    return DEFAULT_DEPARTMENTS;
  }

  try {
    const saved = window.localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
    if (!saved) {
      return DEFAULT_DEPARTMENTS;
    }

    const parsed = JSON.parse(saved) as Array<DepartmentInfo & { portal?: unknown }>;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((department) => {
        const cleaned = { ...department };
        delete cleaned.portal;
        return cleaned;
      });
    }
  } catch {
    // Ignore malformed local storage data and fall back to defaults.
  }

  return DEFAULT_DEPARTMENTS;
}

export function saveStoredDepartments(departments: DepartmentInfo[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(departments));
}

export function getDepartments(): DepartmentInfo[] {
  return getStoredDepartments();
}

export const DEPARTMENTS: DepartmentInfo[] = DEFAULT_DEPARTMENTS;

export function getDepartmentBySlug(slug: string): DepartmentInfo | undefined {
  return getDepartments().find((department) => department.slug === slug);
}

export function slugifyAgency(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface AgencyInfo {
  heading: string;
  name: string;
  slug: string;
}

export function getAgencyBySlug(department: DepartmentInfo, agencySlug: string): AgencyInfo | undefined {
  for (const group of department.agencyGroups ?? []) {
    const match = group.agencies.find((agency) => slugifyAgency(agency) === agencySlug);
    if (match) {
      return { heading: group.heading, name: match, slug: agencySlug };
    }
  }
  return undefined;
}

// Full class strings (not built via template interpolation) so Tailwind's
// content scan can find them - see tailwind.config.ts's content globs.
export const DEPARTMENT_ACCENT_CLASSES: Record<
  DepartmentAccent,
  { border: string; text: string; iconBg: string }
> = {
  blue: { border: "border-t-blue-500", text: "text-blue-400", iconBg: "bg-gradient-to-br from-blue-500 to-blue-800" },
  red: { border: "border-t-red-500", text: "text-red-400", iconBg: "bg-gradient-to-br from-red-500 to-red-800" },
  amber: {
    border: "border-t-amber-500",
    text: "text-amber-400",
    iconBg: "bg-gradient-to-br from-amber-500 to-amber-800",
  },
};
