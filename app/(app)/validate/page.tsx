"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { VALIDATE } from "@/modules/shared/constants";
import { validateStartupIdea } from "@/modules/validation/actions/validation";
import { Button } from "@/modules/shared/components/ui/button";
import { Label } from "@/modules/shared/components/ui/label";
import { Textarea } from "@/modules/shared/components/ui/textarea";

function ValidateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ideaParam = searchParams.get("idea");
    if (ideaParam) {
      setIdea(decodeURIComponent(ideaParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!idea.trim() || idea.trim().length < VALIDATE.minLength) {
      toast.error(VALIDATE.errorMessages.tooShort);
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
                {VALIDATE.heading}
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                {VALIDATE.description}
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
                placeholder={VALIDATE.placeholder}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={10}
                className="resize-none text-sm sm:text-base sm:min-h-[200px]"
                required
                minLength={VALIDATE.minLength}
                maxLength={VALIDATE.maxLength}
              />
              <p className="text-xs text-muted-foreground sm:text-sm">
                {idea.length}/{VALIDATE.maxLength} characters (minimum {VALIDATE.minLength} characters)
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
                  <span className="text-sm sm:text-base">{VALIDATE.buttonLoadingText}</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">{VALIDATE.buttonText}</span>
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
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ValidateContent />
    </Suspense>
  );
}
