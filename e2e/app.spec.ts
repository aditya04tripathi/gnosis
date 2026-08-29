import { expect, test } from "@playwright/test";

test("public routes render successfully", async ({ page }) => {
  for (const path of ["/", "/about", "/pricing", "/privacy", "/terms"]) {
    const response = await page.goto(path);
    expect(response?.ok(), `${path} should respond successfully`).toBeTruthy();
    await expect(page.locator("body")).not.toBeEmpty();
  }
});

test("a new user can save and reload a per-user Ollama preference", async ({
  page,
}) => {
  const email = `playwright-${Date.now()}@example.test`;

  await page.goto("/auth/signup");
  // The streamed auth page mounts its client form after the route shell.
  await page.waitForTimeout(500);
  await page.getByLabel("Full Name").fill("Playwright User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("playwright-password-123");
  await page.getByRole("button", { name: /sign up/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/ai");
  await expect(
    page.getByRole("heading", { name: "AI Preferences" }),
  ).toBeVisible();
  const providerSelect = page.getByRole("combobox").first();
  await expect(providerSelect).toHaveValue("groq");

  await providerSelect.selectOption("ollama");
  await page
    .getByPlaceholder("http://127.0.0.1:11434/api")
    .fill("http://127.0.0.1:11434/api");
  await page.getByPlaceholder("llama3.2").fill("qwen2.5:3b");
  await page.getByRole("button", { name: "Use this provider" }).click();
  await expect(page.getByText("ollama is now active")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("combobox").first()).toHaveValue("ollama");
  await expect(page.getByPlaceholder("llama3.2").first()).toHaveValue(
    "qwen2.5:3b",
  );
});
