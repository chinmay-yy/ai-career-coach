"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BriefcaseIcon,
  LineChart,
  TrendingUp,
  TrendingDown,
  Brain,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import useFetch from "@/hooks/use-fetch";
import { toIndustrySlug, fromIndustrySlug } from "@/app/lib/helper";
import {
  getIndustryInsightsByIndustry,
  getCustomIndustryInsights,
} from "@/actions/dashboard";
import { updateUser } from "@/actions/user";

const DashboardView = ({ insights: initialInsights, industries }) => {
  const [insights, setInsights] = useState(initialInsights);
  const [homeIndustry, setHomeIndustry] = useState(initialInsights.industry);
  const [viewedSlug, setViewedSlug] = useState(initialInsights.industry);

  const initialSelection = fromIndustrySlug(initialInsights.industry, industries);
  const [selectedIndustryId, setSelectedIndustryId] = useState(
    initialSelection.industryId
  );
  const [selectedSubIndustry, setSelectedSubIndustry] = useState(
    initialSelection.subIndustryName
  );
  const [customTerm, setCustomTerm] = useState("");

  const selectedIndustry = industries.find(
    (ind) => ind.id === selectedIndustryId
  );
  const dropdownSlug =
    selectedIndustryId && selectedSubIndustry
      ? toIndustrySlug(selectedIndustryId, selectedSubIndustry)
      : null;
  const isViewingOwnIndustry = viewedSlug === homeIndustry;

  const {
    loading: viewLoading,
    fn: viewIndustryFn,
    data: viewResult,
  } = useFetch(getIndustryInsightsByIndustry);

  const {
    loading: customLoading,
    fn: customIndustryFn,
    data: customResult,
  } = useFetch(getCustomIndustryInsights);

  const {
    loading: saveLoading,
    fn: saveIndustryFn,
    data: saveResult,
  } = useFetch(updateUser);

  const handleViewInsights = () => {
    if (dropdownSlug) viewIndustryFn(dropdownSlug);
  };

  const handleCustomSearch = () => {
    if (customTerm.trim()) customIndustryFn(customTerm.trim());
  };

  const handleSaveAsMyIndustry = () => {
    if (viewedSlug) saveIndustryFn({ industry: viewedSlug });
  };

  useEffect(() => {
    if (viewResult) {
      setInsights(viewResult);
      setViewedSlug(viewResult.industry);
    }
  }, [viewResult]);

  useEffect(() => {
    if (customResult) {
      setInsights(customResult);
      setViewedSlug(customResult.industry);
      setSelectedIndustryId(null);
      setSelectedSubIndustry(null);
    }
  }, [customResult]);

  useEffect(() => {
    if (saveResult?.success) {
      setHomeIndustry(viewedSlug);
      toast.success("Your industry has been updated!");
    }
  }, [saveResult]);

  // Transform salary data for the chart
  const salaryData = insights.salaryRanges.map((range) => ({
    name: range.role,
    min: range.min / 1000,
    max: range.max / 1000,
    median: range.median / 1000,
  }));

  const getDemandLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMarketOutlookInfo = (outlook) => {
    switch (outlook.toLowerCase()) {
      case "positive":
        return { icon: TrendingUp, color: "text-green-500" };
      case "neutral":
        return { icon: LineChart, color: "text-yellow-500" };
      case "negative":
        return { icon: TrendingDown, color: "text-red-500" };
      default:
        return { icon: LineChart, color: "text-gray-500" };
    }
  };

  const OutlookIcon = getMarketOutlookInfo(insights.marketOutlook).icon;
  const outlookColor = getMarketOutlookInfo(insights.marketOutlook).color;

  // Format dates using date-fns
  const lastUpdatedDate = format(new Date(insights.lastUpdated), "dd/MM/yyyy");
  const nextUpdateDistance = formatDistanceToNow(
    new Date(insights.nextUpdate),
    { addSuffix: true }
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Badge variant="outline">Last updated: {lastUpdatedDate}</Badge>
      </div>

      {/* Industry Picker */}
      <Card>
        <CardHeader>
          <CardTitle>Browse Industry Insights</CardTitle>
          <CardDescription>
            View insights for any industry and specialization, not just your
            own.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <div className="space-y-2 flex-1">
              <Select
                value={selectedIndustryId ?? undefined}
                onValueChange={(value) => {
                  setSelectedIndustryId(value);
                  setSelectedSubIndustry(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Industries</SelectLabel>
                    {industries.map((ind) => (
                      <SelectItem key={ind.id} value={ind.id}>
                        {ind.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1">
              <Select
                value={selectedSubIndustry ?? undefined}
                onValueChange={setSelectedSubIndustry}
                disabled={!selectedIndustry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Specializations</SelectLabel>
                    {selectedIndustry?.subIndustries.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleViewInsights}
              disabled={!dropdownSlug || viewLoading}
            >
              {viewLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "View Insights"
              )}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Input
              placeholder="Not listed? Type an industry or specialization..."
              value={customTerm}
              maxLength={60}
              onChange={(e) => setCustomTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCustomSearch();
                }
              }}
            />
            <Button
              variant="secondary"
              onClick={handleCustomSearch}
              disabled={!customTerm.trim() || customLoading}
            >
              {customLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {viewedSlug && !isViewingOwnIndustry && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 p-3 rounded-md border bg-muted/50">
              <p className="text-sm text-muted-foreground flex-1">
                You&apos;re previewing an industry that isn&apos;t saved to
                your profile.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAsMyIndustry}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save as my industry"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Market Outlook
            </CardTitle>
            <OutlookIcon className={`h-4 w-4 ${outlookColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.marketOutlook}</div>
            <p className="text-xs text-muted-foreground">
              Next update {nextUpdateDistance}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Industry Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.growthRate.toFixed(1)}%
            </div>
            <Progress value={insights.growthRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demand Level</CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.demandLevel}</div>
            <div
              className={`h-2 w-full rounded-full mt-2 ${getDemandLevelColor(
                insights.demandLevel
              )}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Skills</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {insights.topSkills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Ranges Chart */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Salary Ranges by Role</CardTitle>
          <CardDescription>
            Displaying minimum, median, and maximum salaries (in thousands)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-md">
                          <p className="font-medium">{label}</p>
                          {payload.map((item) => (
                            <p key={item.name} className="text-sm">
                              {item.name}: ${item.value}K
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="min" fill="#94a3b8" name="Min Salary (K)" />
                <Bar dataKey="median" fill="#64748b" name="Median Salary (K)" />
                <Bar dataKey="max" fill="#475569" name="Max Salary (K)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Industry Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Key Industry Trends</CardTitle>
            <CardDescription>
              Current trends shaping the industry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {insights.keyTrends.map((trend, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Skills</CardTitle>
            <CardDescription>Skills to consider developing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.recommendedSkills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;
