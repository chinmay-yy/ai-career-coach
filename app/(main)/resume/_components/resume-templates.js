export const RESUME_TEMPLATES = {
  professional: {
    name: "Professional",
    description: "ATS-optimized professional format with centered header",
    preview: `JOHN ALEXANDER SMITH
San Francisco, California

📞 +1-555-123-4567 | 📧 john.smith@email.com | 🔗 github.com/johnsmith | 🌐 Portfolio

EDUCATION

Stanford University | 2020 – 2024
Bachelor of Science in Computer Science | Stanford, California

EXPERIENCE

Tech Innovations Inc. | Jun 2024 – Present
Senior Software Engineer
– Engineered and maintained robust, real-time web applications and relational database-driven systems
– Identified system bottlenecks to systematically debug codebases, improving reliability and decreasing load times by 18%
– Spearheaded end-to-end feature modules by integrating scalable RESTful APIs

PROJECTS

AI-Powered Analytics Dashboard
– Developed a comprehensive data analysis platform leveraging machine learning APIs
– Implemented custom states and asynchronous fetching to power dynamic UI updates by 25%

Real-Time Data Visualization Engine
– Designed clean, high-performance interactive visualization environments

TECHNICAL SKILLS

Frontend: HTML5, CSS3, JavaScript (ES6+), TypeScript, React 19, Next.js 15
Styling & UI Components: TailwindCSS V4, Shadcn UI, Material UI
Backend & Security: Node.js, Express.js, REST APIs, JWT Auth, OAuth
Databases: MongoDB, SQL, PostgreSQL
DevOps & Deployment: Git, GitHub, Docker, Vercel, Render`,
    formatter: (data) => formatProfessionalTemplate(data),
  },
  modern: {
    name: "Modern",
    description: "Clean, minimal design with emphasis on achievements",
    preview: `# John Doe
📧 john@email.com | 📱 +1 234 567 8900 | 💼 LinkedIn | 🐦 Twitter

## Professional Summary
Results-driven professional with proven track record in delivering innovative solutions.

## Experience
**Senior Developer** | TechCorp | Jan 2022 - Present
• Led team of 5 engineers in building scalable microservices
• Improved system performance by 40%
• Mentored 3 junior developers

**Developer** | StartupXYZ | Jun 2020 - Dec 2021
• Developed full-stack applications using modern tech stack
• Reduced load time by 60%

## Education
**Bachelor's in Computer Science** | University | 2020

## Projects
**Real-Time Dashboard**
• Developed a live data tracking platform with real-time updates
• Improved performance and user experience significantly

**Analytics Engine**
• Built scalable analytics system processing large datasets

## Skills
JavaScript, React, Node.js, Python, PostgreSQL, AWS, Docker, Kubernetes`,
    formatter: (data) => formatModernTemplate(data),
  },
  classic: {
    name: "Classic",
    description: "Traditional ATS-friendly format",
    preview: `JOHN DOE
john@email.com | +1 234 567 8900 | linkedin.com/in/johndoe | twitter.com/johndoe

PROFESSIONAL SUMMARY
Experienced professional seeking to leverage technical skills and expertise.

EXPERIENCE
Senior Developer
TechCorp | Jan 2022 - Present
- Led development of critical systems
- Managed team performance and delivery

Developer
StartupXYZ | Jun 2020 - Dec 2021
- Built production applications
- Maintained codebase

EDUCATION
Bachelor's in Computer Science
University | 2020

PROJECTS
Real-Time Dashboard
- Developed a live data tracking platform with real-time updates
- Improved performance and user experience significantly

Analytics Engine
- Built scalable analytics system processing large datasets

SKILLS
JavaScript, React, Node.js, Python, PostgreSQL, AWS`,
    formatter: (data) => formatClassicTemplate(data),
  },
  creative: {
    name: "Creative",
    description: "Modern visual design with emojis and formatting",
    preview: `# ✨ JOHN DOE
**📧** john@email.com | **📱** +1 234 567 8900  
**💼** [LinkedIn](https://linkedin.com) | **🐦** [Twitter](https://twitter.com)

---

## 🎯 Professional Summary
Results-driven professional with proven track record in delivering innovative solutions. Passionate about creating impactful products.

---

## 💼 Work Experience

### 🚀 Senior Developer
**TechCorp** | *Jan 2022 - Present*
- ⭐ Led team of 5 engineers in building scalable microservices
- ⭐ Improved system performance by 40%
- ⭐ Mentored 3 junior developers

### 💻 Developer
**StartupXYZ** | *Jun 2020 - Dec 2021*
- ⭐ Developed full-stack applications
- ⭐ Reduced load time by 60%

---

## 🎓 Education
**Bachelor's in Computer Science** | University | 2020

---

## � Projects

### Real-Time Dashboard
- Developed a live data tracking platform with real-time updates
- Improved performance and user experience significantly

### Analytics Engine
- Built scalable analytics system processing large datasets

---

## �🛠️ Skills
JavaScript • React • Node.js • Python • PostgreSQL • AWS • Docker • Kubernetes`,
    formatter: (data) => formatCreativeTemplate(data),
  },
  ats: {
    name: "ATS-Optimized",
    description: "Optimized for Applicant Tracking Systems (no special formatting)",
    preview: `JOHN DOE
john@email.com | +1 234 567 8900

PROFESSIONAL SUMMARY
Results-driven professional with proven track record in delivering innovative solutions. Experienced in full-stack development with expertise in modern technologies.

PROFESSIONAL EXPERIENCE

Senior Developer
TechCorp
January 2022 - Present
Led development of microservices architecture. Improved system performance. Mentored team members.

Developer
StartupXYZ
June 2020 - December 2021
Built full-stack applications. Optimized application performance.

EDUCATION
Bachelor of Science in Computer Science
University
Graduation: 2020

PROJECTS
Real-Time Dashboard
Developed a live data tracking platform with real-time updates. Improved performance and user experience significantly.

Analytics Engine
Built scalable analytics system processing large datasets.

TECHNICAL SKILLS
Programming Languages: JavaScript, Python
Frontend: React, HTML, CSS
Backend: Node.js, Express
Databases: PostgreSQL
Cloud: AWS
Tools: Docker, Kubernetes`,
    formatter: (data) => formatATSTemplate(data),
  },
};

function formatProfessionalTemplate(data) {
  const { contactInfo, summary, skills, experience, education, projects } = data;
  const user = data.user || {};
  
  const contactParts = [];
  if (contactInfo?.email) contactParts.push(`📧 ${contactInfo.email}`);
  if (contactInfo?.mobile) contactParts.push(`📞 ${contactInfo.mobile}`);
  if (contactInfo?.linkedin) contactParts.push(`🔗 ${contactInfo.linkedin}`);
  if (contactInfo?.twitter) contactParts.push(`🌐 ${contactInfo.twitter}`);

  return [
    user.fullName ? user.fullName.toUpperCase() : "YOUR NAME",
    contactInfo?.location || "",
    "",
    contactParts.length > 0 ? contactParts.join(" | ") : "",
    "",
    education?.length > 0 ? formatEducationProfessional(education) : "",
    experience?.length > 0 ? formatExperienceProfessional(experience) : "",
    projects?.length > 0 ? formatProjectsProfessional(projects) : "",
    skills ? `TECHNICAL SKILLS\n\n${skills}` : "",
    summary ? `ACHIEVEMENTS & NOTES\n\n${summary}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function formatEducationProfessional(education) {
  const formatted = education
    .map(
      (edu) =>
        `${edu.school}${edu.graduationDate ? ` | ${edu.graduationDate}` : ""}\n${
          edu.fieldOfStudy || ""
        }${edu.description ? ` | ${edu.description}` : ""}`
    )
    .join("\n\n");
  return `EDUCATION\n\n${formatted}`;
}

function formatExperienceProfessional(experience) {
  const formatted = experience
    .map(
      (exp) =>
        `${exp.company}${exp.startDate && exp.endDate ? ` | ${exp.startDate} – ${exp.endDate}` : ""}\n${
          exp.title || ""
        }${
          exp.description
            ? `\n${exp.description.split("\n").map(line => `– ${line.trim()}`).join("\n")}`
            : ""
        }`
    )
    .join("\n\n");
  return `EXPERIENCE\n\n${formatted}`;
}

function formatProjectsProfessional(projects) {
  const formatted = projects
    .map(
      (proj) =>
        `${proj.title}${proj.link ? ` | ${proj.link}` : ""}${proj.description ? ` | ${proj.description}` : ""}`
    )
    .join("\n\n");
  return `PROJECTS\n\n${formatted}`;
}

function formatModernTemplate(data) {
  const { contactInfo, summary, skills, experience, education, projects } = data;
  const user = data.user || {};
  
  const contactParts = [];
  if (contactInfo?.email) contactParts.push(`📧 ${contactInfo.email}`);
  if (contactInfo?.mobile) contactParts.push(`📱 ${contactInfo.mobile}`);
  if (contactInfo?.linkedin) contactParts.push(`💼 [LinkedIn](${contactInfo.linkedin})`);
  if (contactInfo?.twitter) contactParts.push(`🐦 [Twitter](${contactInfo.twitter})`);

  return [
    `# ${user.fullName || "Your Name"}`,
    contactParts.length > 0 ? contactParts.join(" | ") : "",
    "",
    summary ? `## Professional Summary\n${summary}` : "",
    experience?.length > 0 ? formatExperienceModern(experience) : "",
    education?.length > 0 ? formatEducationModern(education) : "",
    projects?.length > 0 ? formatProjectsModern(projects) : "",
    skills ? `## Skills\n${skills}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function formatClassicTemplate(data) {
  const { contactInfo, summary, skills, experience, education, projects } = data;
  const user = data.user || {};
  
  const contactParts = [];
  if (contactInfo?.email) contactParts.push(contactInfo.email);
  if (contactInfo?.mobile) contactParts.push(contactInfo.mobile);
  if (contactInfo?.linkedin) contactParts.push(contactInfo.linkedin);
  if (contactInfo?.twitter) contactParts.push(contactInfo.twitter);

  return [
    user.fullName?.toUpperCase() || "YOUR NAME",
    contactParts.join(" | "),
    "",
    summary ? `PROFESSIONAL SUMMARY\n${summary}` : "",
    experience?.length > 0 ? formatExperienceClassic(experience) : "",
    education?.length > 0 ? formatEducationClassic(education) : "",
    projects?.length > 0 ? formatProjectsClassic(projects) : "",
    skills ? `SKILLS\n${skills}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function formatCreativeTemplate(data) {
  const { contactInfo, summary, skills, experience, education, projects } = data;
  const user = data.user || {};
  
  const contactParts = [];
  if (contactInfo?.email) contactParts.push(`**📧** ${contactInfo.email}`);
  if (contactInfo?.mobile) contactParts.push(`**📱** ${contactInfo.mobile}`);
  if (contactInfo?.linkedin) contactParts.push(`**💼** [LinkedIn](${contactInfo.linkedin})`);
  if (contactInfo?.twitter) contactParts.push(`**🐦** [Twitter](${contactInfo.twitter})`);

  return [
    `# ✨ ${user.fullName || "Your Name"}`,
    contactParts.join(" | "),
    "---",
    summary ? `## 🎯 Professional Summary\n${summary}` : "",
    "---",
    experience?.length > 0 ? formatExperienceCreative(experience) : "",
    "---",
    education?.length > 0 ? formatEducationCreative(education) : "",
    "---",
    projects?.length > 0 ? formatProjectsCreative(projects) : "",
    skills ? `## 🛠️ Skills\n${skills.split(",").map(s => s.trim()).join(" • ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function formatATSTemplate(data) {
  const { contactInfo, summary, skills, experience, education, projects } = data;
  const user = data.user || {};
  
  const contactParts = [];
  if (contactInfo?.email) contactParts.push(contactInfo.email);
  if (contactInfo?.mobile) contactParts.push(contactInfo.mobile);

  return [
    user.fullName || "YOUR NAME",
    contactParts.join(" | "),
    "",
    summary ? `PROFESSIONAL SUMMARY\n${summary}` : "",
    experience?.length > 0 ? formatExperienceATS(experience) : "",
    education?.length > 0 ? formatEducationATS(education) : "",
    projects?.length > 0 ? formatProjectsATS(projects) : "",
    skills ? `TECHNICAL SKILLS\n${skills.split(",").map(s => `${s.trim()}`).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

// Experience formatters
function formatExperienceModern(experience) {
  const formatted = experience
    .map(
      (exp) =>
        `### ${exp.title}${exp.company ? ` | ${exp.company}` : ""}${
          exp.startDate && exp.endDate ? ` | ${exp.startDate} - ${exp.endDate}` : ""
        }\n${exp.description || ""}`
    )
    .join("\n\n");
  return `## Work Experience\n\n${formatted}`;
}

function formatExperienceClassic(experience) {
  const formatted = experience
    .map(
      (exp) =>
        `${exp.title}${exp.company ? `\n${exp.company}` : ""}${
          exp.startDate && exp.endDate ? `\n${exp.startDate} - ${exp.endDate}` : ""
        }${exp.description ? `\n${exp.description}` : ""}`
    )
    .join("\n\n");
  return `EXPERIENCE\n${formatted}`;
}

function formatExperienceCreative(experience) {
  const formatted = experience
    .map(
      (exp) =>
        `### 💼 ${exp.title}${exp.company ? `\n**${exp.company}** | *${exp.startDate} - ${exp.endDate}*` : ""}\n${
          exp.description ? exp.description.split("\n").map(line => `- ⭐ ${line.trim()}`).join("\n") : ""
        }`
    )
    .join("\n\n");
  return `## 💼 Work Experience\n\n${formatted}`;
}

function formatExperienceATS(experience) {
  const formatted = experience
    .map(
      (exp) =>
        `${exp.title}${exp.company ? `\n${exp.company}` : ""}${
          exp.startDate && exp.endDate ? `\n${exp.startDate} - ${exp.endDate}` : ""
        }${exp.description ? `\n${exp.description}` : ""}`
    )
    .join("\n\n");
  return `PROFESSIONAL EXPERIENCE\n${formatted}`;
}

// Education formatters
function formatEducationModern(education) {
  const formatted = education
    .map(
      (edu) =>
        `**${edu.school}** | ${edu.fieldOfStudy}${edu.graduationDate ? ` | ${edu.graduationDate}` : ""}\n${
          edu.description || ""
        }`
    )
    .join("\n\n");
  return `## Education\n\n${formatted}`;
}

function formatEducationClassic(education) {
  const formatted = education
    .map(
      (edu) =>
        `${edu.fieldOfStudy}${edu.school ? `\n${edu.school}` : ""}${
          edu.graduationDate ? `\nGraduation: ${edu.graduationDate}` : ""
        }${edu.description ? `\n${edu.description}` : ""}`
    )
    .join("\n\n");
  return `EDUCATION\n${formatted}`;
}

function formatEducationCreative(education) {
  const formatted = education
    .map(
      (edu) =>
        `### 🎓 ${edu.fieldOfStudy}\n**${edu.school}**${edu.graduationDate ? ` | *${edu.graduationDate}*` : ""}${
          edu.description ? `\n${edu.description}` : ""
        }`
    )
    .join("\n\n");
  return `## 🎓 Education\n\n${formatted}`;
}

function formatEducationATS(education) {
  const formatted = education
    .map(
      (edu) =>
        `${edu.fieldOfStudy}${edu.school ? `\n${edu.school}` : ""}${
          edu.graduationDate ? `\nGraduation: ${edu.graduationDate}` : ""
        }${edu.description ? `\n${edu.description}` : ""}`
    )
    .join("\n\n");
  return `EDUCATION\n${formatted}`;
}

// Projects formatters
function formatProjectsModern(projects) {
  const formatted = projects
    .map(
      (proj) =>
        `**${proj.title}**${proj.link ? ` | [Link](${proj.link})` : ""}\n${proj.description || ""}`
    )
    .join("\n\n");
  return `## Projects\n\n${formatted}`;
}

function formatProjectsClassic(projects) {
  const formatted = projects
    .map(
      (proj) => `${proj.title}${proj.link ? `\n${proj.link}` : ""}\n${proj.description || ""}`
    )
    .join("\n\n");
  return `PROJECTS\n${formatted}`;
}

function formatProjectsCreative(projects) {
  const formatted = projects
    .map(
      (proj) =>
        `### 🚀 ${proj.title}${proj.link ? `\n[View Project](${proj.link})` : ""}\n${proj.description || ""}`
    )
    .join("\n\n");
  return `## 🚀 Projects\n\n${formatted}`;
}

function formatProjectsATS(projects) {
  const formatted = projects
    .map(
      (proj) => `${proj.title}${proj.link ? `\n${proj.link}` : ""}\n${proj.description || ""}`
    )
    .join("\n\n");
  return `PROJECTS\n${formatted}`;
}
