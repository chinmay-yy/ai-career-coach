// Each entry is a visual design preset applied to the SAME structured resume
// data — no separate markdown per template. `headerAlign`/`sectionHeaderStyle`
// give real layout variety using react-pdf's core Helvetica font only (no
// custom font files to manage).
export const RESUME_TEMPLATES = {
  classic: {
    name: "Classic",
    description: "Centered header, understated section dividers",
    accent: "#1d4ed8",
    headerAlign: "center",
    sectionHeaderStyle: "underline",
  },
  modern: {
    name: "Modern",
    description: "Left-aligned header, clean minimal dividers",
    accent: "#0f766e",
    headerAlign: "left",
    sectionHeaderStyle: "underline",
  },
  bold: {
    name: "Bold",
    description: "High-contrast section headers with a solid color bar",
    accent: "#7c3aed",
    headerAlign: "left",
    sectionHeaderStyle: "bar",
  },
};
