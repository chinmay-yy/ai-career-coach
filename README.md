# 🚀 AI Career Coach  
### AI-Powered Career Growth Platform for Modern Job Seekers

AI Career Coach is a **production-grade full-stack SaaS application** that helps users accelerate their job search journey with **AI-generated resumes, cover letters, interview preparation, and career insights**.

Built with **Next.js, Prisma, NeonDB, Clerk, Gemini AI, Inngest, TailwindCSS, and shadcn/ui**, this platform solves real-world career problems using modern AI workflows and scalable architecture.

---

## ✨ Features

### 🧠 AI Resume Builder
Generate ATS-friendly resumes tailored for:
- target job role
- skills
- experience level
- job description
- recruiter optimization

### ✍️ AI Cover Letter Generator
Create personalized cover letters in seconds:
- role-specific
- company-focused
- strengths aligned
- recruiter-friendly language

### 🎯 Interview Preparation
Boost confidence with:
- AI-generated interview questions
- skill-based quizzes
- role-specific preparation
- instant feedback
- performance improvement suggestions

### 📊 Career Insights Dashboard
Track career growth using:
- market trends
- in-demand skills
- role insights
- salary intelligence
- learning recommendations

### 🔐 Secure Authentication
Powered by Clerk:
- sign up / sign in
- route protection
- onboarding flow
- user-specific data isolation

### ⚙️ Background AI Workflows
Using Inngest:
- async AI generation
- workflow orchestration
- event-driven processing
- scalable background jobs

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Server Actions, API Routes |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Authentication | Clerk |
| AI | Google Gemini |
| Background Jobs | Inngest |
| Deployment | Vercel |

---


## ⚡ Local Setup

### 1) Clone the repository
```bash
git clone https://github.com/chinmay-yy/ai-career-coach.git
cd ai-career-coach
```

### 2) Install dependencies
```bash
npm install
```

### 3) Setup environment variables
Create `.env` file:

```env
DATABASE_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

GEMINI_API_KEY=
```

### 4) Run database migration
```bash
npx prisma migrate dev
```

### 5) Start development server
```bash
npm run dev
```


---

## 🧩 Folder Structure
```bash
app/
components/
actions/
lib/
hooks/
prisma/
public/
data/
```

---

## 🎯 Engineering Highlights
This project demonstrates:
- full-stack SaaS architecture
- AI workflow integration
- auth + onboarding systems
- async background jobs
- scalable DB design
- production UI systems
- modern React patterns
- real-world product thinking

This makes it a **strong portfolio project for:**
- SDE internships
- frontend/full-stack roles
- GenAI product engineering
- AI SaaS startups

---

## 🚀 Future Improvements
Planned upgrades:
- 📄 resume PDF export
- 🎙️ voice mock interviews
- 📌 job application tracker
- 📈 skill-gap analyzer
- 🔗 LinkedIn profile import
- 🤖 AI roadmap generator
- 👨‍💼 recruiter dashboard

---

## 👨‍💻 Author
**Chinmay Saini**  
CS Engineering Student | Full Stack + AI Builder

GitHub: https://github.com/chinmay-yy

---

## ⭐ Show Your Support
If you like this project, **star the repo ⭐**

It helps visibility and makes your GitHub profile stronger for recruiters.
