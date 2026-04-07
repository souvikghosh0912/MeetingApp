"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Flag } from "lucide-react";
import { toast } from "sonner";

type ReportType = "comment" | "share" | "page" | "database" | "transcript" | "user";
type ReportReason =
  | "inappropriate"
  | "spam"
  | "harassment"
  | "copyright"
  | "private_data"
  | "other";

interface PublicReportButtonProps {
  itemId: string;
  reportType: ReportType;
  className?: string;
  variant?: "inline" | "standalone";
}

const REASON_LABELS: Record<ReportReason, string> = {
  inappropriate: "Inappropriate content",
  spam: "Spam",
  harassment: "Harassment or bullying",
  copyright: "Copyright violation",
  private_data: "Contains private/sensitive data",
  other: "Other",
};

export function PublicReportButton({
  itemId,
  reportType,
  className = "",
  variant = "inline",
}: PublicReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason for reporting");
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Please provide a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report_type: reportType,
          item_id: itemId,
          reason,
          description: description || null,
          reporter_email: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      toast.success(data.message || "Report submitted successfully");
      setOpen(false);
      setDescription("");
      setReason("inappropriate");
      setEmail("");
    } catch (error) {
      console.error("Report submission error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit report"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (variant === "standalone") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className={className}>
            <Flag className="h-4 w-4 mr-2" />
            Report This Content
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Report This Content</DialogTitle>
            <DialogDescription>
              Help us keep the community safe. Tell us why you&apos;re reporting this item.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Your email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll use this to follow up on your report if needed.
              </p>
            </div>

            {/* Reason Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for reporting</label>
              <div className="space-y-2">
                {(Object.entries(REASON_LABELS) as [ReportReason, string][]).map(
                  ([value, label]) => (
                    <label key={value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reason"
                        value={value}
                        checked={reason === value}
                        onChange={(e) => setReason(e.target.value as ReportReason)}
                        className="h-4 w-4"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Additional details (optional)
              </label>
              <Textarea
                id="description"
                placeholder="Provide any additional context that might help our team understand your report..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/1000 characters
              </p>
            </div>

            {/* Privacy Notice */}
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                Your report is confidential and will only be reviewed by our moderation team.
                False reports may result in action on your account.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Inline variant (for use in menus)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={className} title="Report this content">
          <Flag className="h-4 w-4" />
          <span className="ml-1">Report</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Help us keep the community safe. Tell us why you&apos;re reporting this item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Your email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for reporting</label>
            <div className="space-y-2">
              {(Object.entries(REASON_LABELS) as [ReportReason, string][]).map(
                ([value, label]) => (
                  <label key={value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      checked={reason === value}
                      onChange={(e) => setReason(e.target.value as ReportReason)}
                      className="h-4 w-4"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Additional details (optional)
            </label>
            <Textarea
              id="description"
              placeholder="Provide any additional context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Privacy Notice */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              Your report is confidential and will be reviewed by our moderation team.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
