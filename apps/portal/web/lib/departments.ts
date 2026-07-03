// Canonical department slugs + display labels. The slugs mirror DEPARTMENTS in
// the portal API (apps/portal/api/src/members/model.rs) — the API rejects any
// value outside this list, so this is the single frontend source of truth for
// both the join form and the profile editor.
export const DEPARTMENTS = [
  { value: "matematicas", label: "Departamento de Matemáticas y Ciencias" },
  { value: "arquitectura", label: "Escuela de Arquitectura" },
  { value: "gerencia", label: "Escuela de Gerencia y Emprendimiento" },
  { value: "biomedica", label: "Departamento de Ingeniería Biomédica" },
  {
    value: "civil",
    label: "Departamento de Ingeniería Civil, Ambiental y Agrimensura",
  },
  { value: "industrial", label: "Departamento de Ingeniería Industrial" },
  {
    value: "electrica",
    label:
      "Departamento de Ingeniería Eléctrica, de Computadoras y Ciencias de la Computación",
  },
  { value: "mecanica", label: "Departamento de Ingeniería Mecánica" },
] as const;

export type DepartmentSlug = (typeof DEPARTMENTS)[number]["value"];

/** Display label for a department slug; falls back to the raw slug. */
export function departmentLabel(slug: string): string {
  return DEPARTMENTS.find((d) => d.value === slug)?.label ?? slug;
}
