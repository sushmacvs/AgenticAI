import { test, expect } from '@playwright/test';


test('test_user_login_valid_credentials', async ({ page }) => {
    // REQ-001 - User can log in with valid credentials
    // Navigate to the login page
    await page.goto("http://localhost:3000/login");

    // Enter valid credentials
    await page.getByLabel("Username").fill("tomsmith");
    await page.getByLabel("Password").fill("SuperSecretPassword!");

    // Click the Login button
    await page.getByRole("button", { name: "Login" }).click();

    // Verify successful login redirect
    await expect(page).toHaveURL("http://localhost:3000/secure");
    await expect(page.getByText("You logged into a secure area!")).toBeVisible();
});


test('test_login_rejects_invalid_credentials', async ({ page }) => {
    // REQ-002 - Login form rejects invalid credentials
    await page.goto("http://localhost:3000/login");

    // Enter invalid credentials
    await page.getByLabel("Username").fill("wronguser");
    await page.getByLabel("Password").fill("wrongpass");
    await page.getByRole("button", { name: "Login" }).click();

    // Error message must be visible
    await expect(page.getByText("Your username is invalid!")).toBeVisible();
    await expect(page).toHaveURL("http://localhost:3000/login");
});


test('test_dropdown_option_selection', async ({ page }) => {
    // REQ-003 - Dropdown list allows selecting an option
    await page.goto("http://localhost:3000/dropdown");

    const dropdown = page.locator("#dropdown");
    await dropdown.selectOption("1");

    await expect(dropdown).toHaveValue("1");
    await expect(dropdown).toContainText("Option 1");
});


test('test_checkboxes_toggle', async ({ page }) => {
    // REQ-004 - Checkboxes can be checked and unchecked
    await page.goto("http://localhost:3000/checkboxes");

    const checkboxes = page.locator("input[type='checkbox']");

    // Toggle first checkbox
    const first = checkboxes.nth(0);
    const initialState = await first.isChecked();
    await first.click();
    if (!initialState) {
      await expect(first).toBeChecked();
    } else {
      await expect(first).not.toBeChecked();
    }

    // Toggle second checkbox
    const second = checkboxes.nth(1);
    await second.click();
    await expect(second).toBeChecked();
});


test('test_dynamic_content_visible', async ({ page }) => {
    // REQ-005 - Dynamic content loads and is visible
    await page.goto("http://localhost:3000/dynamic_content");

    // Page must have some body text content
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator(".large-10")).toBeVisible();
});
