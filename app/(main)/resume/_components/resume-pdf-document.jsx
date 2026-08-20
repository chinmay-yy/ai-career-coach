import { Document, Page, Text, View, Link, StyleSheet } from "@react-pdf/renderer";

const DEFAULT_ACCENT = "#2563eb";

function createStyles(accent = DEFAULT_ACCENT, headerAlign = "center") {
  return StyleSheet.create({
    page: { padding: 40, fontSize: 10, lineHeight: 1.4, color: "#1e293b" },
    header: { marginBottom: 14, alignItems: headerAlign === "center" ? "center" : "flex-start" },
    name: { fontSize: 20, fontWeight: 700, color: accent, marginBottom: 4 },
    contactRow: { flexDirection: "row", flexWrap: "wrap", fontSize: 9.5, color: "#475569" },
    contactSep: { marginHorizontal: 4, color: "#cbd5e1" },
    link: { color: accent, textDecoration: "none" },

    sectionUnderline: {
      fontSize: 12,
      fontWeight: 700,
      color: accent,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      borderBottomWidth: 1.5,
      borderBottomColor: accent,
      paddingBottom: 3,
      marginTop: 12,
      marginBottom: 6,
    },
    sectionBar: {
      fontSize: 11,
      fontWeight: 700,
      color: "#ffffff",
      backgroundColor: accent,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      paddingVertical: 4,
      paddingHorizontal: 8,
      marginTop: 12,
      marginBottom: 6,
    },

    paragraph: { fontSize: 10, lineHeight: 1.45 },
    itemBlock: { marginBottom: 8 },
    itemHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
    itemTitle: { fontSize: 10.5, fontWeight: 700 },
    itemDate: { fontSize: 9.5, color: "#64748b" },
    itemSubtitle: { fontSize: 9.5, color: "#475569", marginBottom: 2 },
    bulletRow: { flexDirection: "row", marginTop: 2, paddingLeft: 6 },
    bulletMarker: { width: 10, color: accent },
    bulletText: { flex: 1, fontSize: 10, lineHeight: 1.4 },
  });
}

function dateRange(entry) {
  if (entry.current) return `${entry.startDate} – Present`;
  return [entry.startDate, entry.endDate].filter(Boolean).join(" – ");
}

function Bullets({ text, styles }) {
  const lines = (text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <>
      {lines.map((line, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletMarker}>•</Text>
          <Text style={styles.bulletText}>{line}</Text>
        </View>
      ))}
    </>
  );
}

function SectionHeader({ children, style, sectionHeaderStyle }) {
  return (
    <Text style={sectionHeaderStyle === "bar" ? style.sectionBar : style.sectionUnderline}>
      {children}
    </Text>
  );
}

// Renders a resume directly from structured form data (the same shape
// react-hook-form uses: contactInfo/summary/skills/experience/education/projects)
// — no markdown, no text parsing.
export function ResumePdfDocument({ data, fullName, design = {} }) {
  const { accent, headerAlign = "center", sectionHeaderStyle = "underline" } = design;
  const styles = createStyles(accent, headerAlign);
  const { contactInfo = {}, summary, skills, experience = [], education = [], projects = [] } = data || {};

  const contacts = [
    contactInfo.email && { text: contactInfo.email, href: `mailto:${contactInfo.email}` },
    contactInfo.mobile && { text: contactInfo.mobile },
    contactInfo.linkedin && { text: "LinkedIn", href: contactInfo.linkedin },
    contactInfo.twitter && { text: "Twitter", href: contactInfo.twitter },
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {fullName && <Text style={styles.name}>{fullName}</Text>}
          <View style={styles.contactRow}>
            {contacts.map((c, i) => (
              <View key={i} style={{ flexDirection: "row" }}>
                {i > 0 && <Text style={styles.contactSep}>|</Text>}
                {c.href ? (
                  <Link src={c.href} style={styles.link}>
                    <Text>{c.text}</Text>
                  </Link>
                ) : (
                  <Text>{c.text}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {summary && (
          <>
            <SectionHeader style={styles} sectionHeaderStyle={sectionHeaderStyle}>
              Professional Summary
            </SectionHeader>
            <Text style={styles.paragraph}>{summary}</Text>
          </>
        )}

        {experience.length > 0 && (
          <>
            <SectionHeader style={styles} sectionHeaderStyle={sectionHeaderStyle}>
              Experience
            </SectionHeader>
            {experience.map((exp, i) => (
              <View key={i} style={styles.itemBlock} wrap={false}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>{exp.title}</Text>
                  <Text style={styles.itemDate}>{dateRange(exp)}</Text>
                </View>
                {exp.organization && <Text style={styles.itemSubtitle}>{exp.organization}</Text>}
                <Bullets text={exp.description} styles={styles} />
              </View>
            ))}
          </>
        )}

        {education.length > 0 && (
          <>
            <SectionHeader style={styles} sectionHeaderStyle={sectionHeaderStyle}>
              Education
            </SectionHeader>
            {education.map((edu, i) => (
              <View key={i} style={styles.itemBlock} wrap={false}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>{edu.title}</Text>
                  <Text style={styles.itemDate}>{dateRange(edu)}</Text>
                </View>
                {edu.organization && <Text style={styles.itemSubtitle}>{edu.organization}</Text>}
                <Bullets text={edu.description} styles={styles} />
              </View>
            ))}
          </>
        )}

        {projects.length > 0 && (
          <>
            <SectionHeader style={styles} sectionHeaderStyle={sectionHeaderStyle}>
              Projects
            </SectionHeader>
            {projects.map((proj, i) => (
              <View key={i} style={styles.itemBlock} wrap={false}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>{proj.title}</Text>
                  {proj.link && (
                    <Link src={proj.link} style={styles.link}>
                      <Text style={styles.itemDate}>Link</Text>
                    </Link>
                  )}
                </View>
                {proj.description && <Text style={styles.paragraph}>{proj.description}</Text>}
              </View>
            ))}
          </>
        )}

        {skills && (
          <>
            <SectionHeader style={styles} sectionHeaderStyle={sectionHeaderStyle}>
              Skills
            </SectionHeader>
            <Text style={styles.paragraph}>{skills}</Text>
          </>
        )}
      </Page>
    </Document>
  );
}
