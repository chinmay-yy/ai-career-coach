"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Target, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import useFetch from "@/hooks/use-fetch";
import {
  getResumeMatchScore,
  generateTailoredResume,
  saveResumeScore,
} from "@/actions/resume";

export function JobDescriptionTools({
  open,
  onOpenChange,
  resumeData,
  onScoreUpdate,
  onApplyTailoredResume,
}) {
  const [jobDescription, setJobDescription] = useState("");

  const {
    loading: scoring,
    fn: checkScoreFn,
    data: scoreResult,
    error: scoreError,
  } = useFetch(getResumeMatchScore);

  const {
    loading: tailoring,
    fn: generateTailoredFn,
    data: tailoredResult,
    error: tailoredError,
  } = useFetch(generateTailoredResume);

  const { fn: saveScoreFn } = useFetch(saveResumeScore);

  useEffect(() => {
    if (scoreResult) {
      onScoreUpdate?.(scoreResult.atsScore);
      saveScoreFn({ atsScore: scoreResult.atsScore, feedback: scoreResult.feedback });
    }
    if (scoreError) toast.error(scoreError.message || "Failed to check match score");
  }, [scoreResult, scoreError]);

  useEffect(() => {
    if (tailoredError) {
      toast.error(tailoredError.message || "Failed to generate tailored resume");
    }
  }, [tailoredError]);

  const handleCheckScore = () => {
    if (!jobDescription.trim()) {
      toast.error("Paste a job description first");
      return;
    }
    checkScoreFn({ resumeData, jobDescription });
  };

  const handleGenerateTailored = () => {
    if (!jobDescription.trim()) {
      toast.error("Paste a job description first");
      return;
    }
    generateTailoredFn({ resumeData, jobDescription });
  };

  const handleApply = () => {
    onApplyTailoredResume?.(tailoredResult.resume);
    onScoreUpdate?.(tailoredResult.atsScore);
    saveScoreFn({ atsScore: tailoredResult.atsScore, feedback: tailoredResult.feedback });
    toast.success("Tailored resume applied — review it in the Preview tab");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Target a Job</DialogTitle>
          <DialogDescription>
            Paste a job description to check your resume&apos;s AI-estimated ATS
            match, or generate a version tailored to it.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="Paste the job description here..."
          className="h-40"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCheckScore}
            disabled={scoring || tailoring}
            className="flex-1"
          >
            {scoring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Check Match Score
              </>
            )}
          </Button>
          <Button
            onClick={handleGenerateTailored}
            disabled={scoring || tailoring}
            className="flex-1"
          >
            {tailoring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Tailored Resume
              </>
            )}
          </Button>
        </div>

        {scoreResult && (
          <div className="space-y-2 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI-estimated ATS match</span>
              <Badge variant="outline">{scoreResult.atsScore}/100</Badge>
            </div>
            <Progress value={scoreResult.atsScore} />
            <p className="text-sm text-muted-foreground">{scoreResult.feedback}</p>
            {scoreResult.missingKeywords?.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">Missing keywords</p>
                <div className="flex flex-wrap gap-1">
                  {scoreResult.missingKeywords.map((kw) => (
                    <Badge key={kw} variant="secondary">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tailoredResult && (
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Tailored resume — estimated ATS match
              </span>
              <Badge variant="outline">{tailoredResult.atsScore}/100</Badge>
            </div>
            <Progress value={tailoredResult.atsScore} />
            <p className="text-sm text-muted-foreground">{tailoredResult.feedback}</p>
            <div className="text-xs bg-muted/50 p-3 rounded">
              <p className="font-medium mb-1">New summary</p>
              <p className="text-muted-foreground">{tailoredResult.resume?.summary}</p>
            </div>
            <Button onClick={handleApply} className="w-full">
              Apply This Version
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
