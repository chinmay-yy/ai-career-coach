"use client";

function dateRange(entry) {
  if (entry.current) return `${entry.startDate} – Present`;
  return [entry.startDate, entry.endDate].filter(Boolean).join(" – ");
}

function SectionHeading({ children, accent, sectionHeaderStyle }) {
  if (sectionHeaderStyle === "bar") {
    return (
      <h2
        className="text-sm font-bold uppercase tracking-wide text-white px-3 py-1.5 mt-5 mb-2"
        style={{ backgroundColor: accent }}
      >
        {children}
      </h2>
    );
  }
  return (
    <h2
      className="text-sm font-bold uppercase tracking-wide pb-1 mt-5 mb-2 border-b-2"
      style={{ color: accent, borderColor: accent }}
    >
      {children}
    </h2>
  );
}

function Bullets({ text }) {
  const lines = (text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <ul className="mt-1 space-y-0.5 list-disc pl-5">
      {lines.map((line, i) => (
        <li key={i} className="text-sm">
          {line}
        </li>
      ))}
    </ul>
  );
}

// Live, always-in-sync preview rendered from the same structured data as the
// PDF — no markdown, no separate "did my edit survive" state to track.
export default function ResumePreview({ data, fullName, design = {} }) {
  const { accent = "#2563eb", headerAlign = "center", sectionHeaderStyle = "underline" } = design;
  const { contactInfo = {}, summary, skills, experience = [], education = [], projects = [] } = data || {};

  const contacts = [
    contactInfo.email,
    contactInfo.mobile,
    contactInfo.linkedin && "LinkedIn",
    contactInfo.twitter && "Twitter",
  ].filter(Boolean);

  return (
    <div className="bg-white text-slate-800 p-10 rounded-lg border shadow-sm max-w-3xl mx-auto">
      <div className={headerAlign === "center" ? "text-center" : "text-left"}>
        {fullName && (
          <h1 className="text-2xl font-bold" style={{ color: accent }}>
            {fullName}
          </h1>
        )}
        {contacts.length > 0 && (
          <p className="text-sm text-slate-500 mt-1">{contacts.join(" | ")}</p>
        )}
      </div>

      {summary && (
        <section>
          <SectionHeading accent={accent} sectionHeaderStyle={sectionHeaderStyle}>
            Professional Summary
          </SectionHeading>
          <p className="text-sm">{summary}</p>
        </section>
      )}

      {experience.length > 0 && (
        <section>
          <SectionHeading accent={accent} sectionHeaderStyle={sectionHeaderStyle}>
            Experience
          </SectionHeading>
          {experience.map((exp, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">{exp.title}</span>
                <span className="text-xs text-slate-500">{dateRange(exp)}</span>
              </div>
              {exp.organization && (
                <p className="text-xs text-slate-600">{exp.organization}</p>
              )}
              <Bullets text={exp.description} />
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section>
          <SectionHeading accent={accent} sectionHeaderStyle={sectionHeaderStyle}>
            Education
          </SectionHeading>
          {education.map((edu, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">{edu.title}</span>
                <span className="text-xs text-slate-500">{dateRange(edu)}</span>
              </div>
              {edu.organization && (
                <p className="text-xs text-slate-600">{edu.organization}</p>
              )}
              <Bullets text={edu.description} />
            </div>
          ))}
        </section>
      )}

      {projects.length > 0 && (
        <section>
          <SectionHeading accent={accent} sectionHeaderStyle={sectionHeaderStyle}>
            Projects
          </SectionHeading>
          {projects.map((proj, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">{proj.title}</span>
                {proj.link && (
                  <a
                    href={proj.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs"
                    style={{ color: accent }}
                  >
                    Link
                  </a>
                )}
              </div>
              {proj.description && <p className="text-sm mt-1">{proj.description}</p>}
            </div>
          ))}
        </section>
      )}

      {skills && (
        <section>
          <SectionHeading accent={accent} sectionHeaderStyle={sectionHeaderStyle}>
            Skills
          </SectionHeading>
          <p className="text-sm">{skills}</p>
        </section>
      )}
    </div>
  );
}
