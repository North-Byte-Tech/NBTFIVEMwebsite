"use client";

import { useEffect, useMemo, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import {
  DEFAULT_APPLICATION_TYPES,
  getStoredApplicationTypes,
  saveStoredApplicationTypes,
  type ApplicationTypeDefinition,
  type FormFieldDefinition,
} from "@/lib/applicationTypes";

const STORAGE_KEY = "fmrp-admin-form-builder";

type FieldTemplate = {
  name: string;
  label: string;
  type: FormFieldDefinition["type"];
  required: boolean;
  placeholder?: string;
  options?: string[];
};

const FIELD_TEMPLATES: FieldTemplate[] = [
  { name: "full_name", label: "Full Name", type: "text", required: true, placeholder: "Enter name" },
  { name: "email", label: "Email Address", type: "text", required: true, placeholder: "name@example.com" },
  { name: "discord_id", label: "Discord ID", type: "text", required: true, placeholder: "discord_id" },
  { name: "age", label: "Age", type: "text", required: true, placeholder: "Age" },
  { name: "experience", label: "Roleplay Experience", type: "textarea", required: true, placeholder: "Tell us about your experience" },
  { name: "reason", label: "Why do you want to join?", type: "textarea", required: true, placeholder: "Tell us why you want to join" },
  { name: "availability", label: "Availability", type: "select", required: true, options: ["Part-time", "Full-time", "Weekends only"], placeholder: "Select availability" },
  { name: "agree_to_rules", label: "I have read and agree to the server rules", type: "select", required: true, options: ["Yes", "No"], placeholder: "Select an option" },
];

function makeField(template: FieldTemplate): FormFieldDefinition {
  return {
    id: `${template.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: template.name,
    label: template.label,
    type: template.type,
    required: template.required,
    placeholder: template.placeholder,
    options: template.options,
  };
}

export function FormBuilderEditor() {
  const [types, setTypes] = useState<ApplicationTypeDefinition[]>(() => getStoredApplicationTypes());
  const [selectedTypeId, setSelectedTypeId] = useState(() => getStoredApplicationTypes()[0]?.id ?? DEFAULT_APPLICATION_TYPES[0]!.id);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState({
    name: "",
    label: "",
    type: "text" as FormFieldDefinition["type"],
    placeholder: "",
    required: true,
  });

  useEffect(() => {
    saveStoredApplicationTypes(types);
    window.dispatchEvent(new Event("fmrp-form-builder-updated"));
  }, [types]);

  const selectedType = useMemo(
    () => types.find((type) => type.id === selectedTypeId) ?? types[0] ?? DEFAULT_APPLICATION_TYPES[0]!,
    [selectedTypeId, types],
  );

  const fieldCountLabel = `${selectedType.fields.length} field${selectedType.fields.length === 1 ? "" : "s"} configured`;
  const requiredFieldCount = selectedType.fields.filter((field) => field.required).length;

  function updateSelectedType(updater: (type: ApplicationTypeDefinition) => ApplicationTypeDefinition) {
    setTypes((current) => current.map((type) => (type.id === selectedTypeId ? updater(type) : type)));
  }

  function updateField(fieldId: string, updater: (field: FormFieldDefinition) => FormFieldDefinition) {
    updateSelectedType((type) => ({
      ...type,
      fields: type.fields.map((field) => (field.id === fieldId ? updater(field) : field)),
    }));
  }

  function removeField(fieldId: string) {
    updateSelectedType((type) => ({
      ...type,
      fields: type.fields.filter((field) => field.id !== fieldId),
    }));
  }

  function addTemplateField(template: FieldTemplate) {
    updateSelectedType((type) => ({
      ...type,
      fields: [...type.fields, makeField(template)],
    }));
    setShowTemplates(false);
  }

  function addType() {
    const id = `custom-application-${Date.now()}`;
    const newType: ApplicationTypeDefinition = {
      id,
      department: "LEO",
      name: "Custom Application",
      description: "Custom recruitment form for a new department or team.",
      active: true,
      fields: [],
    };

    setTypes((current) => [...current, newType]);
    setSelectedTypeId(id);
  }

  function addCustomField() {
    if (!newField.name.trim() || !newField.label.trim()) {
      return;
    }

    const fieldName = newField.name.trim();
    const fieldLabel = newField.label.trim();

    updateSelectedType((type) => ({
      ...type,
      fields: [
        ...type.fields,
        {
          id: `${fieldName}-${Date.now()}`,
          name: fieldName,
          label: fieldLabel,
          type: newField.type,
          required: newField.required,
          placeholder: newField.placeholder.trim() || undefined,
        },
      ],
    }));

    setNewField({ name: "", label: "", type: "text", placeholder: "", required: true });
    setShowAddField(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-black tracking-tight text-bone">Application Form Builder</h1>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={buttonClasses("secondary", "rounded-xl border border-line bg-surface px-3 py-2.5")}>↥ Import</button>
          <button type="button" className={buttonClasses("secondary", "rounded-xl border border-line bg-surface px-3 py-2.5")}>↧ Export</button>
          <button type="button" className={buttonClasses("secondary", "rounded-xl border border-line bg-surface px-3 py-2.5")}>◉ Preview Form</button>
          <button type="button" className={buttonClasses("primary", "rounded-xl px-4 py-2.5")}>🗂 Save Configuration</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-2">
        {types.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setSelectedTypeId(type.id)}
            className={[
              "rounded-t-md border px-4 py-2 text-sm font-medium transition",
              type.id === selectedTypeId
                ? "border-line bg-surface text-bone shadow-glow-sm"
                : "border-transparent bg-transparent text-muted hover:text-bone",
            ].join(" ")}
          >
            {type.name.split(" ")[0]}
          </button>
        ))}

        <button
          type="button"
          onClick={addType}
          className="ml-auto rounded-md border border-dashed border-line bg-transparent px-3 py-1.5 text-sm text-muted transition hover:text-bone"
        >
          + New Application
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="flex items-center gap-3 border-b border-line bg-[#1a1d14] px-5 py-4">
            <span className="text-xl">⚙</span>
            <h2 className="text-2xl font-bold text-bone">Form Settings</h2>
          </div>

          <div className="space-y-5 p-5">
            <label className="block text-sm font-medium text-bone">
              <span className="mb-2 block">Form Title*</span>
              <input
                className="w-full rounded-xl border border-line bg-[#20241a] px-3 py-3 text-base text-bone outline-none transition placeholder:text-muted focus:border-trooper-500"
                value={selectedType.name}
                onChange={(event) =>
                  updateSelectedType((type) => ({ ...type, name: event.target.value }))
                }
              />
            </label>

            <label className="block text-sm font-medium text-bone">
              <span className="mb-2 block">Description</span>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-line bg-[#20241a] px-3 py-3 text-base text-bone outline-none transition placeholder:text-muted focus:border-trooper-500"
                value={selectedType.description}
                onChange={(event) =>
                  updateSelectedType((type) => ({ ...type, description: event.target.value }))
                }
              />
            </label>

            <button
              type="button"
              onClick={() =>
                updateSelectedType((type) => ({ ...type, active: !type.active }))
              }
              className="flex w-full items-center justify-between rounded-xl border border-line bg-[#1a1d14] px-3 py-3 text-left"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-bone">
                <span
                  className={[
                    "inline-flex h-5 w-5 items-center justify-center rounded-md border text-xs",
                    selectedType.active ? "border-green-400 bg-green-500/20 text-green-300" : "border-line text-muted",
                  ].join(" ")}
                >
                  {selectedType.active ? "✓" : ""}
                </span>
                Form Active
              </span>
              <span className="rounded-md border border-line bg-[#11150d] px-2 py-1 text-[10px] uppercase text-muted">
                {selectedType.active ? "Visible" : "Hidden"}
              </span>
            </button>

            <div className="space-y-2 pt-2 text-sm text-muted">
              <div>{fieldCountLabel}</div>
              <div>{requiredFieldCount} required fields</div>
              <div>{selectedType.fields.filter((field) => field.type === "select").length} select fields</div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-2xl font-bold text-bone">Form Fields</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowTemplates(true)} className={buttonClasses("secondary", "rounded-xl border border-line bg-[#1d2017] px-3 py-2.5")}>⚡ Templates</button>
              <button type="button" onClick={() => setShowAddField(true)} className={buttonClasses("primary", "rounded-xl px-4 py-2.5")}>＋ Add Field</button>
            </div>
          </div>

          <div className="p-5">
            {selectedType.fields.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center text-center text-base text-muted">
                <div>
                  <p className="text-xl font-medium text-bone">No fields added yet</p>
                  <p className="mt-2">Click "Add Field" or use a template to get started</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedType.fields.map((field) => (
                  <div key={field.id} className="rounded-xl border border-line bg-[#171b12] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-xl font-bold text-bone">{field.label}</div>
                        <div className="text-sm text-muted">{field.name}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        className="rounded-lg border border-line bg-[#1d2017] px-2 py-1 text-xs text-muted transition hover:text-bone"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <label className="text-xs uppercase tracking-wide text-muted">
                        Label
                        <input
                          className="mt-1 w-full rounded-lg border border-line bg-[#121610] px-2 py-2 text-sm text-bone"
                          value={field.label}
                          onChange={(event) =>
                            updateField(field.id, (current) => ({ ...current, label: event.target.value }))
                          }
                        />
                      </label>

                      <label className="text-xs uppercase tracking-wide text-muted">
                        Name
                        <input
                          className="mt-1 w-full rounded-lg border border-line bg-[#121610] px-2 py-2 text-sm text-bone"
                          value={field.name}
                          onChange={(event) =>
                            updateField(field.id, (current) => ({ ...current, name: event.target.value }))
                          }
                        />
                      </label>

                      <label className="text-xs uppercase tracking-wide text-muted">
                        Type
                        <select
                          className="mt-1 w-full rounded-lg border border-line bg-[#121610] px-2 py-2 text-sm text-bone"
                          value={field.type}
                          onChange={(event) =>
                            updateField(field.id, (current) => ({
                              ...current,
                              type: event.target.value as FormFieldDefinition["type"],
                            }))
                          }
                        >
                          <option value="text">Text Input</option>
                          <option value="textarea">Text Area</option>
                          <option value="select">Select</option>
                        </select>
                      </label>

                      <label className="flex items-center gap-2 pt-6 text-xs uppercase tracking-wide text-muted">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) =>
                            updateField(field.id, (current) => ({ ...current, required: event.target.checked }))
                          }
                        />
                        Required
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-5xl rounded-2xl border border-line bg-[#111712] shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="text-2xl font-bold text-bone">Field Templates</h3>
              <button type="button" onClick={() => setShowTemplates(false)} className="text-2xl text-muted hover:text-bone">×</button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              {FIELD_TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => addTemplateField(template)}
                  className="rounded-xl border border-line bg-[#171b12] p-4 text-left transition hover:border-trooper-500"
                >
                  <div className="text-xl font-bold text-bone">{template.label}</div>
                  <div className="mt-2 text-sm text-muted">{template.name}</div>
                  <div className="mt-3 text-xs uppercase tracking-wide text-muted">
                    Type: {template.type} • {template.required ? "Required" : "Optional"}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end border-t border-line px-5 py-4">
              <button type="button" onClick={() => setShowTemplates(false)} className={buttonClasses("secondary", "rounded-xl px-4 py-2")}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showAddField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-5xl rounded-2xl border border-line bg-[#111712] shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="text-2xl font-bold text-bone">Add New Field</h3>
              <button type="button" onClick={() => setShowAddField(false)} className="text-2xl text-muted hover:text-bone">×</button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-medium text-bone">
                  <span className="mb-2 block">Field Name*</span>
                  <input
                    className="w-full rounded-xl border border-line bg-[#20241a] px-3 py-3 text-base text-bone outline-none focus:border-trooper-500"
                    placeholder="e.g., discordUsername"
                    value={newField.name}
                    onChange={(event) => setNewField((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>

                <label className="block text-sm font-medium text-bone">
                  <span className="mb-2 block">Label*</span>
                  <input
                    className="w-full rounded-xl border border-line bg-[#20241a] px-3 py-3 text-base text-bone outline-none focus:border-trooper-500"
                    placeholder="e.g., Discord Username"
                    value={newField.label}
                    onChange={(event) => setNewField((current) => ({ ...current, label: event.target.value }))}
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-medium text-bone">
                  <span className="mb-2 block">Field Type</span>
                  <select
                    className="w-full rounded-xl border border-line bg-[#20241a] px-3 py-3 text-base text-bone outline-none focus:border-trooper-500"
                    value={newField.type}
                    onChange={(event) =>
                      setNewField((current) => ({
                        ...current,
                        type: event.target.value as FormFieldDefinition["type"],
                      }))
                    }
                  >
                    <option value="text">Text Input</option>
                    <option value="textarea">Text Area</option>
                    <option value="select">Select</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-bone">
                  <span className="mb-2 block">Placeholder</span>
                  <input
                    className="w-full rounded-xl border border-line bg-[#20241a] px-3 py-3 text-base text-bone outline-none focus:border-trooper-500"
                    placeholder="Optional placeholder text"
                    value={newField.placeholder}
                    onChange={(event) => setNewField((current) => ({ ...current, placeholder: event.target.value }))}
                  />
                </label>
              </div>

              <div className="rounded-xl border border-line bg-[#171b12] p-4">
                <label className="flex items-center justify-between gap-3 text-sm font-medium text-bone">
                  <span>Required</span>
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(event) => setNewField((current) => ({ ...current, required: event.target.checked }))}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-line px-5 py-4">
              <button type="button" onClick={() => setShowAddField(false)} className={buttonClasses("secondary", "rounded-xl px-4 py-2")}>Cancel</button>
              <button type="button" onClick={addCustomField} className={buttonClasses("primary", "rounded-xl px-4 py-2")}>Add Field</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
