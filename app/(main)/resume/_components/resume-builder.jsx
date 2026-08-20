"use client";

import { useRef, useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Loader2, Save, Target, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveResume, parseResumeFile } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import { JobDescriptionTools } from "./job-description-tools";
import ResumePreview from "./resume-preview";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { resumeSchema } from "@/app/lib/schema";
import { RESUME_TEMPLATES } from "./resume-templates";

const EMPTY_RESUME = {
  contactInfo: {},
  summary: "",
  skills: "",
  experience: [],
  education: [],
  projects: [],
};

function parseInitialResume(content) {
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null; // pre-rewrite resumes were stored as markdown; start fresh
  }
}

export default function ResumeBuilder({ initialResume }) {
  const initialData = parseInitialResume(initialResume?.content);
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState(initialData ? "preview" : "edit");
  const [selectedTemplate, setSelectedTemplate] = useState("classic");
  const [showJdTools, setShowJdTools] = useState(false);
  const [atsScore, setAtsScore] = useState(initialResume?.atsScore ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: initialData || EMPTY_RESUME,
  });

  const formValues = watch();
  const design = RESUME_TEMPLATES[selectedTemplate];

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

  const {
    loading: isParsingResume,
    fn: parseResumeFileFn,
    data: parsedResume,
    error: parseResumeError,
  } = useFetch(parseResumeFile);

  useEffect(() => {
    if (saveResult && !isSaving) toast.success("Resume saved successfully!");
    if (saveError) toast.error(saveError.message || "Failed to save resume");
  }, [saveResult, saveError, isSaving]);

  useEffect(() => {
    if (parsedResume) {
      reset(parsedResume);
      setActiveTab("edit");
      toast.success("Resume uploaded — review the auto-filled fields below");
    }
    if (parseResumeError) {
      toast.error(parseResumeError.message || "Failed to read that resume");
    }
  }, [parsedResume, parseResumeError]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large (max 5MB)");
      return;
    }

    const hasExistingContent = formValues.summary || formValues.experience?.length > 0;
    if (hasExistingContent && !window.confirm("This will replace your current form data. Continue?")) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    await parseResumeFileFn(formData);
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const [{ pdf }, { ResumePdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./resume-pdf-document"),
      ]);
      const blob = await pdf(
        <ResumePdfDocument data={formValues} fullName={user?.fullName} design={design} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "resume.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data) => {
    await saveResumeFn(JSON.stringify(data));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <div>
          <h1 className="font-bold gradient-title text-5xl md:text-6xl">
            Resume Builder
          </h1>
          {atsScore != null && (
            <Badge variant="outline" className="mt-1">
              AI-estimated ATS score: {atsScore}/100
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-end items-center">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.txt,.md"
            hidden
            onChange={handleFileSelected}
          />
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RESUME_TEMPLATES).map(([key, t]) => (
                <SelectItem key={key} value={key}>
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full mr-2"
                    style={{ backgroundColor: t.accent }}
                  />
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleUploadClick} disabled={isParsingResume}>
            {isParsingResume ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Resume
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setShowJdTools(true)}>
            <Target className="h-4 w-4 mr-2" />
            Target a Job
          </Button>
          <Button variant="destructive" onClick={handleSubmit(onSubmit)} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <JobDescriptionTools
        open={showJdTools}
        onOpenChange={setShowJdTools}
        resumeData={formValues}
        onScoreUpdate={(score) => setAtsScore(score)}
        onApplyTailoredResume={(tailoredData) => {
          reset(tailoredData);
          setActiveTab("preview");
        }}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Form</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    {...register("contactInfo.email")}
                    type="email"
                    placeholder="your@email.com"
                    error={errors.contactInfo?.email}
                  />
                  {errors.contactInfo?.email && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mobile Number</label>
                  <Input
                    {...register("contactInfo.mobile")}
                    type="tel"
                    placeholder="+1 234 567 8900"
                  />
                  {errors.contactInfo?.mobile && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.mobile.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LinkedIn URL</label>
                  <Input
                    {...register("contactInfo.linkedin")}
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                  {errors.contactInfo?.linkedin && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.linkedin.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Twitter/X Profile
                  </label>
                  <Input
                    {...register("contactInfo.twitter")}
                    type="url"
                    placeholder="https://twitter.com/your-handle"
                  />
                  {errors.contactInfo?.twitter && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.twitter.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Summary</h3>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32"
                    placeholder="Write a compelling professional summary..."
                    error={errors.summary}
                  />
                )}
              />
              {errors.summary && (
                <p className="text-sm text-red-500">{errors.summary.message}</p>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skills</h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32"
                    placeholder="List your key skills..."
                    error={errors.skills}
                  />
                )}
              />
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Work Experience</h3>
              <Controller
                name="experience"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Experience"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.experience && (
                <p className="text-sm text-red-500">
                  {errors.experience.message}
                </p>
              )}
            </div>

            {/* Education */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Education</h3>
              <Controller
                name="education"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Education"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.education && (
                <p className="text-sm text-red-500">
                  {errors.education.message}
                </p>
              )}
            </div>

            {/* Projects */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Projects</h3>
              <Controller
                name="projects"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Project"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.projects && (
                <p className="text-sm text-red-500">
                  {errors.projects.message}
                </p>
              )}
            </div>
          </form>
        </TabsContent>

        <TabsContent value="preview">
          <ResumePreview data={formValues} fullName={user?.fullName} design={design} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
