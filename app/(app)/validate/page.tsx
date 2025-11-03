"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { validateStartupIdea } from "@/actions/validation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function ValidateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill idea from query parameter
  useEffect(() => {
    const ideaParam = searchParams.get("idea");
    if (ideaParam) {
      setIdea(decodeURIComponent(ideaParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!idea.trim() || idea.trim().length < 10) {
      toast.error(
        "Please provide a detailed startup idea (at least 10 characters)",
      );
      return;
    }

    setLoading(true);
    try {
      const result = await validateStartupIdea(idea);

      if (result.error) {
        if (result.upgradeRequired) {
          toast.error(result.error, {
            action: {
              label: "Upgrade",
              onClick: () => router.push("/pricing"),
            },
          });
        } else {
          toast.error(result.error);
        }
        return;
      }

      if (result.success && result.validationId) {
        toast.success("Idea validated successfully!");
        router.push(`/validation/${result.validationId}`);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col container mx-auto">
      <main className="flex flex-1 items-center justify-center">
        <div className="w-full space-y-6 sm:space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 sm:h-14 sm:w-14">
              <Sparkles className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                Validate Your Startup Idea
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Describe your startup idea and get AI-powered validation with
                detailed feedback
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="idea"
                className="text-sm font-medium sm:text-base"
              >
                Your Startup Idea
              </Label>
              <Textarea
                id="idea"
                placeholder="Describe your startup idea in detail. Include what problem you're solving, your target audience, and how your solution works..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={10}
                className="resize-none text-sm sm:text-base sm:min-h-[200px]"
                required
                minLength={10}
              />
              <p className="text-xs text-muted-foreground sm:text-sm">
                {idea.length}/1000 characters (minimum 10 characters)
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Validating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Validate Idea</span>
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function ValidatePage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ValidateContent />
    </Suspense>
  );
}
