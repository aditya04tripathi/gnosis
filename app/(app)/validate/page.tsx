"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/modules/shared/components/ui/button";
import { Label } from "@/modules/shared/components/ui/label";
import { Textarea } from "@/modules/shared/components/ui/textarea";
import { VALIDATE } from "@/modules/shared/constants";
import { validateStartupIdea } from "@/modules/validation/actions/validation";

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
    <div className="flex h-full flex-col">
      <main className="flex flex-1 items-center justify-center">
        <div className="container mx-auto w-full">
          <div className="w-full space-y-6 sm:space-y-8">
            <div>
              <h1>{VALIDATE.heading}</h1>
              <p className="text-muted-foreground">{VALIDATE.description}</p>
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
                />
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
                    <span className="text-sm sm:text-base">
                      {VALIDATE.buttonLoadingText}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">
                      {VALIDATE.buttonText}
                    </span>
                  </>
                )}
              </Button>
            </form>
          </div>
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
