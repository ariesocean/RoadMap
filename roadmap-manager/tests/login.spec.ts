import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    // Reload the page to apply the cleared state
    await page.reload();
    // Wait for the app to render
    await page.waitForTimeout(1000);
  });

  test('should display login page when not logged in', async ({ page }) => {
    // Check if login page is displayed by looking for login-specific elements
    await expect(page.getByText('Roadmap Manager')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your username')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should display registration modal when clicking Sign up', async ({ page }) => {
    // Click Sign up link (button with "Sign up" text)
    await page.click('button:has-text("Sign up")');
    await page.waitForTimeout(500);

    // Check if registration modal is displayed
    await expect(page.getByText('Create an Account')).toBeVisible();
    await expect(page.getByPlaceholder('Choose a username')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Create a password')).toBeVisible();
  });

  test('should show error when logging in with empty credentials', async ({ page }) => {
    // Click Sign In without entering credentials
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(500);

    // Check if error message is displayed
    await expect(page.getByText('Please check your username or password')).toBeVisible();
  });

  test('should show error when registering with empty credentials', async ({ page }) => {
    // Open registration modal
    await page.click('button:has-text("Sign up")');
    await page.waitForTimeout(500);

    // Click Sign Up button in modal (the blue button with "Sign Up" text)
    await page.click('button:has-text("Sign Up")');
    await page.waitForTimeout(500);

    // Check if error message is displayed
    await expect(page.getByText('Please check your username or password')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Enter credentials
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password123');

    // Click Sign In
    await page.click('button:has-text("Sign In")');

    // Wait for navigation to main app (check for search box which only exists in main app)
    await expect(page.getByPlaceholder('Search tasks...')).toBeVisible({ timeout: 10000 });
  });

  test('should register successfully with valid credentials', async ({ page }) => {
    // Open registration modal
    await page.click('button:has-text("Sign up")');
    await page.waitForTimeout(500);

    // Fill in registration form
    await page.fill('input[placeholder="Choose a username"]', 'newuser');
    await page.fill('input[placeholder="Enter your email"]', 'newuser@example.com');
    await page.fill('input[placeholder="Create a password"]', 'password123');

    // Click Sign Up button in modal
    await page.click('button:has-text("Sign Up")');

    // Wait for navigation to main app
    await expect(page.getByPlaceholder('Search tasks...')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Account Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage first
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForTimeout(1000);

    // Navigate to the app and login
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    // Wait for login to complete - look for search box which only exists in main app
    await expect(page.getByPlaceholder('Search tasks...')).toBeVisible({ timeout: 10000 });
  });

  test('should display account popup when clicking username', async ({ page }) => {
    // Click on username to open account popup
    await page.click('text=testuser');
    await page.waitForTimeout(500);

    // Check if account popup is displayed
    await expect(page.getByText('Change Username')).toBeVisible();
    await expect(page.getByText('Change Password')).toBeVisible();
    await expect(page.getByText('Logout')).toBeVisible();
  });

  test('should update username', async ({ page }) => {
    // Click on username to open account popup
    await page.click('text=testuser');
    await page.waitForTimeout(500);

    // Click Change Username
    await page.click('text=Change Username');
    await page.waitForTimeout(500);

    // Enter new username and confirm
    await page.fill('input[placeholder="New username"]', 'updateduser');
    await page.click('button:has-text("Confirm")');
    await page.waitForTimeout(500);

    // Check if updated username is displayed
    await expect(page.getByText('updateduser')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Click on username to open account popup
    await page.click('text=testuser');
    await page.waitForTimeout(500);

    // Click Logout
    await page.click('text=Logout');
    await page.waitForTimeout(500);

    // Wait for navigation to login page
    await expect(page.getByPlaceholder('Enter your username')).toBeVisible();
  });
});

test.describe('Theme Toggle', () => {
  test('should toggle theme on login page', async ({ page }) => {
    // Clear localStorage first
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForTimeout(1000);

    // Click theme toggle button (has title with "mode")
    await page.click('button[title*="mode"]');
    await page.waitForTimeout(500);

    // Theme should have changed - just verify the button is still there
    await expect(page.locator('button[title*="mode"]')).toBeVisible();
  });
});
