import type { DepartmentCode } from "@/lib/departments";

export type FormFieldType = "text" | "textarea" | "select";

export interface FormFieldDefinition {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface ApplicationTypeDefinition {
  id: string;
  department: DepartmentCode;
  name: string;
  description: string;
  active: boolean;
  fields: FormFieldDefinition[];
}

export const DEFAULT_APPLICATION_FIELDS: Record<DepartmentCode, FormFieldDefinition[]> = {
  LEO: [
    {
      id: "leo-timezone",
      name: "timezone",
      label: "What timezone are you in?",
      type: "text",
      required: true,
      placeholder: "Example: EST / UTC+10",
    },
    {
      id: "leo-experience",
      name: "experience",
      label: "What emergency services / RP experience do you have?",
      type: "textarea",
      required: true,
      placeholder: "Tell us about your roleplay background.",
    },
    {
      id: "leo-availability",
      name: "availability",
      label: "How many hours per week can you commit?",
      type: "text",
      required: true,
      placeholder: "Example: 8-12 hours/week",
    },
    {
      id: "leo-preference",
      name: "preferredRole",
      label: "Which role are you most interested in?",
      type: "select",
      required: true,
      options: ["Patrol", "Investigations", "Traffic", "Command", "Other"],
    },
  ],
  SAFD: [
    {
      id: "safd-timezone",
      name: "timezone",
      label: "What timezone are you in?",
      type: "text",
      required: true,
      placeholder: "Example: PST / UTC+1",
    },
    {
      id: "safd-experience",
      name: "experience",
      label: "Do you have emergency response or fire RP experience?",
      type: "textarea",
      required: true,
      placeholder: "Tell us about your background.",
    },
    {
      id: "safd-availability",
      name: "availability",
      label: "How many hours per week can you commit?",
      type: "text",
      required: true,
      placeholder: "Example: 6-10 hours/week",
    },
    {
      id: "safd-focus",
      name: "responseFocus",
      label: "What kind of fire response work interests you most?",
      type: "select",
      required: true,
      options: ["Engine Crew", "Rescue", "Hazmat", "Medical Response", "Command"],
    },
  ],
  SAEMS: [
    {
      id: "saems-timezone",
      name: "timezone",
      label: "What timezone are you in?",
      type: "text",
      required: true,
      placeholder: "Example: GMT / UTC+8",
    },
    {
      id: "saems-experience",
      name: "experience",
      label: "What medical or RP experience do you have?",
      type: "textarea",
      required: true,
      placeholder: "Tell us about your medical roleplay background.",
    },
    {
      id: "saems-availability",
      name: "availability",
      label: "How many hours per week can you commit?",
      type: "text",
      required: true,
      placeholder: "Example: 4-8 hours/week",
    },
    {
      id: "saems-role",
      name: "medicalFocus",
      label: "Which EMS role are you most interested in?",
      type: "select",
      required: true,
      options: ["Ambulance", "Triage", "Advanced Life Support", "Operations", "Other"],
    },
  ],
  DISPATCH: [
    {
      id: "dispatch-timezone",
      name: "timezone",
      label: "What timezone are you in?",
      type: "text",
      required: true,
      placeholder: "Example: PST / UTC+11",
    },
    {
      id: "dispatch-experience",
      name: "experience",
      label: "Do you have dispatch, radio, or operations experience?",
      type: "textarea",
      required: true,
      placeholder: "Tell us about your communication or operations background.",
    },
    {
      id: "dispatch-availability",
      name: "availability",
      label: "How many hours per week can you commit?",
      type: "text",
      required: true,
      placeholder: "Example: 6-12 hours/week",
    },
    {
      id: "dispatch-focus",
      name: "dispatchFocus",
      label: "What type of dispatch work interests you most?",
      type: "select",
      required: true,
      options: ["Regional Dispatch", "Priority Calls", "Operations Support", "Supervisor", "Other"],
    },
  ],
  CIV: [
    {
      id: "civ-timezone",
      name: "timezone",
      label: "What timezone are you in?",
      type: "text",
      required: true,
      placeholder: "Example: AEST / UTC+10",
    },
    {
      id: "civ-experience",
      name: "experience",
      label: "What civilian or community RP experience do you have?",
      type: "textarea",
      required: true,
      placeholder: "Tell us about yourself and the kind of community roleplay you enjoy.",
    },
    {
      id: "civ-availability",
      name: "availability",
      label: "How often can you take part in the community?",
      type: "text",
      required: true,
      placeholder: "Example: Most evenings / weekends",
    },
    {
      id: "civ-focus",
      name: "communityFocus",
      label: "What kind of civilian role interests you most?",
      type: "select",
      required: true,
      options: ["Community Events", "Support Roles", "Public Services", "Business & Life RP", "Other"],
    },
  ],
};

export const APPLICATION_TYPES_STORAGE_KEY = "nbt-admin-form-builder";

export const DEFAULT_APPLICATION_TYPES: ApplicationTypeDefinition[] = [
  {
    id: "leo-application",
    department: "LEO",
    name: "Law Enforcement",
    description: "Recruitment form for patrol, investigations, and command roles.",
    active: true,
    fields: DEFAULT_APPLICATION_FIELDS.LEO,
  },
  {
    id: "safd-application",
    department: "SAFD",
    name: "Fire & Rescue",
    description: "Recruitment form for fire response, rescue, and support operations.",
    active: true,
    fields: DEFAULT_APPLICATION_FIELDS.SAFD,
  },
  {
    id: "saems-application",
    department: "SAEMS",
    name: "EMS",
    description: "Recruitment form for medical response and ambulance operations.",
    active: true,
    fields: DEFAULT_APPLICATION_FIELDS.SAEMS,
  },
  {
    id: "dispatch-application",
    department: "DISPATCH",
    name: "Dispatch",
    description: "Recruitment form for communication, operations, and dispatch coordination.",
    active: true,
    fields: DEFAULT_APPLICATION_FIELDS.DISPATCH,
  },
  {
    id: "civ-application",
    department: "CIV",
    name: "Civilian",
    description: "Recruitment form for civilian and community roles.",
    active: true,
    fields: DEFAULT_APPLICATION_FIELDS.CIV,
  },
];

export function getStoredApplicationTypes(): ApplicationTypeDefinition[] {
  if (typeof window === "undefined") {
    return DEFAULT_APPLICATION_TYPES;
  }

  try {
    const saved = window.localStorage.getItem(APPLICATION_TYPES_STORAGE_KEY);
    if (!saved) {
      return DEFAULT_APPLICATION_TYPES;
    }

    const parsed = JSON.parse(saved) as ApplicationTypeDefinition[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Ignore malformed local storage data and fall back to defaults.
  }

  return DEFAULT_APPLICATION_TYPES;
}

export function saveStoredApplicationTypes(types: ApplicationTypeDefinition[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APPLICATION_TYPES_STORAGE_KEY, JSON.stringify(types));
}

export function getDepartmentRecruitmentOpen(department: DepartmentCode): boolean {
  const stored = getStoredApplicationTypes();
  const match = stored.find((type) => type.department === department);
  return Boolean(match?.active ?? false);
}

export function getApplicationTypeByDepartment(department: DepartmentCode): ApplicationTypeDefinition {
  const stored = getStoredApplicationTypes();
  return (
    stored.find((type) => type.department === department) ??
    stored.find((type) => type.id === department) ??
    stored[0] ??
    DEFAULT_APPLICATION_TYPES[0]!
  );
}
