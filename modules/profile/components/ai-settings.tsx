"use client";

import { Key, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  updateAIPreferences,
  updateAPIKeys,
} from "@/modules/profile/actions/profile";
import { Alert, AlertDescription } from "@/modules/shared/components/ui/alert";
import { Button } from "@/modules/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/modules/shared/components/ui/card";
import { Input } from "@/modules/shared/components/ui/input";
import { Label } from "@/modules/shared/components/ui/label";

const providers = [
  "groq",
  "openai",
  "gemini",
  "anthropic",
  "custom",
  "ollama",
] as const;
type Provider = (typeof providers)[number];

export function AISettings({
  settings,
  connected,
}: {
  settings: {
    provider: Provider;
    customBaseUrl?: string;
    customModel?: string;
    ollamaBaseUrl?: string;
    ollamaModel?: string;
  };
  connected: Record<Exclude<Provider, "ollama">, boolean>;
}) {
  const [provider, setProvider] = useState<Provider>(settings.provider);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState(
    settings.customBaseUrl || "",
  );
  const [customModel, setCustomModel] = useState(settings.customModel || "");
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState(
    settings.ollamaBaseUrl || "http://127.0.0.1:11434/api",
  );
  const [ollamaModel, setOllamaModel] = useState(
    settings.ollamaModel || "llama3.2",
  );
  const [keyStatus, setKeyStatus] = useState(connected);

  async function saveProvider() {
    setIsLoading(true);
    const form = new FormData();
    form.set("aiProvider", provider);
    form.set("customBaseUrl", customBaseUrl);
    form.set("customModel", customModel);
    form.set("ollamaBaseUrl", ollamaBaseUrl);
    form.set("ollamaModel", ollamaModel);
    const result = await updateAIPreferences(form);
    setIsLoading(false);
    result.error
      ? toast.error(result.error)
      : toast.success(`${provider} is now active`);
  }
  async function saveKey(action: "save" | "remove") {
    if (provider === "ollama") return;
    if (action === "save" && !apiKey.trim())
      return toast.error("Enter an API key first");
    setIsLoading(true);
    const form = new FormData();
    form.set("provider", provider);
    form.set("action", action);
    form.set("apiKey", apiKey.trim());
    const result = await updateAPIKeys(form);
    setIsLoading(false);
    if (result.error) return toast.error(result.error);
    setApiKey("");
    setKeyStatus((current) => ({ ...current, [provider]: action === "save" }));
    toast.success(action === "save" ? "Key securely connected" : "Key removed");
  }
  const providerNeedsKey = provider !== "ollama";
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI provider</CardTitle>
          <CardDescription>
            Select the provider used for validation, plans, and improvements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            disabled={isLoading}
          >
            {providers.map((item) => (
              <option key={item} value={item}>
                {item === "custom"
                  ? "OpenAI-compatible"
                  : item === "ollama"
                    ? "Ollama (local server)"
                    : item[0].toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
          {provider === "groq" && (
            <Alert>
              <AlertDescription>
                Groq uses the server API key by default. Connect your own key
                below only if you want to override it.
              </AlertDescription>
            </Alert>
          )}
          {provider === "custom" && (
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
              />
              <Input
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="Model name"
              />
            </div>
          )}
          {provider === "ollama" && (
            <Alert>
              <AlertDescription>
                Ollama must be reachable from the Gnosis server. Local endpoints
                require the server setting{" "}
                <code>ALLOW_LOCAL_AI_ENDPOINTS=true</code>.
              </AlertDescription>
            </Alert>
          )}
          {provider === "ollama" && (
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={ollamaBaseUrl}
                onChange={(e) => setOllamaBaseUrl(e.target.value)}
                placeholder="http://127.0.0.1:11434/api"
              />
              <Input
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                placeholder="llama3.2"
              />
            </div>
          )}
          <Button onClick={saveProvider} disabled={isLoading}>
            {isLoading ? "Saving..." : "Use this provider"}
          </Button>
        </CardContent>
      </Card>
      {providerNeedsKey && (
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <Key className="h-5 w-5" />
              {provider === "groq"
                ? "Override with your own Groq key"
                : `Bring your own ${provider} key`}
            </CardTitle>
            <CardDescription>
              {provider === "groq"
                ? "Optional. Without a personal key, requests use the server GROQ_API_KEY."
                : "Keys are AES-256-GCM encrypted at rest and never returned to the browser."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="api-key">
              {keyStatus[provider] ? "Replace your key" : "API key"}
            </Label>
            <Input
              id="api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste a key"
            />
            <div className="flex gap-3">
              <Button onClick={() => saveKey("save")} disabled={isLoading}>
                {keyStatus[provider] ? "Rotate key" : "Connect key"}
              </Button>
              {keyStatus[provider] && (
                <Button
                  variant="outline"
                  onClick={() => saveKey("remove")}
                  disabled={isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
