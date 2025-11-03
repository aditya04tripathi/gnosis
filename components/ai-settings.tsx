"use client";

import type groq from "groq-sdk";
import { Eye, EyeOff, Key } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateAIPreferences, updateAPIKeys } from "@/actions/profile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AISettingsProps {
  user: {
    _id: string;
    preferences?: {
      aiProvider?: string;
      theme?: string;
    };
    apiKeys?: {
      groq?: string;
    };
  };
  groqModels: groq.Models.Model[];
}

export function AISettings({ user, groqModels }: AISettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(
    user.preferences?.aiProvider || "gemini",
  );
  const aiProviders = groqModels;
  const [groqApiKey, setGroqApiKey] = useState(user.apiKeys?.groq || "");
  const [showGroqKey, setShowGroqKey] = useState(false);

  useEffect(() => {}, []);

  const saveProviderPreference = async (provider: string) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("aiProvider", provider);

      const result = await updateAIPreferences(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("AI preferences updated successfully!");
        setSelectedProvider(provider);
      }
    } catch {
      toast.error("Failed to update AI preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await saveProviderPreference(selectedProvider);
  };

  const handleAPIKeysSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoadingKeys(true);

    try {
      const formData = new FormData();
      formData.append("groq", groqApiKey);

      const result = await updateAPIKeys(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("API keys updated successfully!");
      }
    } catch {
      toast.error("Failed to update API keys");
    } finally {
      setIsLoadingKeys(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Provider Selection</CardTitle>
          <CardDescription>
            Choose which AI provider powers your validations and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {aiProviders.map((provider) => {
                const isSelected = selectedProvider === provider.id;
                return (
                  <Button
                    key={provider.id}
                    type="button"
                    variant={isSelected ? "outline" : "ghost"}
                    onClick={() => saveProviderPreference(provider.id)}
                    disabled={isLoading}
                    className={`h-auto p-4 justify-start text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="w-full">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium">
                          {provider.id} ({provider.owned_by})
                        </span>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>

            <div className="flex justify-end gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>
            Information about your AI usage and rate limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-medium">Current Provider</span>
              <span className="text-sm text-muted-foreground">
                {aiProviders.find((p) => p.id === selectedProvider)?.id ||
                  selectedProvider}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-medium">Monthly Credits</span>
              <span className="text-sm text-muted-foreground">Unlimited</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Response Quality</span>
              <span className="text-sm text-muted-foreground">
                High (optimized)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Add your own API keys to use custom AI providers (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAPIKeysSubmit} className="space-y-6">
            <Alert>
              <AlertDescription>
                Your API keys are encrypted and stored securely. Leaving a key
                empty will use our default keys.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="groq-api-key" className="flex items-center gap-2">
                Groq API Key
              </Label>
              <CardDescription className="text-sm text-muted-foreground mb-2">
                This API key works for all Groq models. Get your key from{" "}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Groq Console
                </a>
                .
              </CardDescription>
              <div className="relative">
                <Input
                  id="groq-api-key"
                  type={showGroqKey ? "text" : "password"}
                  placeholder="Enter your Groq API key"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  disabled={isLoadingKeys}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                >
                  {showGroqKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="submit" disabled={isLoadingKeys}>
                {isLoadingKeys ? "Saving..." : "Save API Keys"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
