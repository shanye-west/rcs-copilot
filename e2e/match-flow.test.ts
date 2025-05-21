import { test, expect } from '@playwright/test';

// Test constants
const TEST_USERNAME = 'testuser';
const TEST_PIN = '1234';
const TEST_MATCH_ID = 'test-match-1'; // Replace with a valid match ID from your database

test.describe('Match Scoring Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Go to the login page
		await page.goto('/login');

		// Login
		await page.fill('input[name="username"]', TEST_USERNAME);
		await page.fill('input[name="pin"]', TEST_PIN);
		await page.click('button[type="submit"]');

		// Wait for navigation
		await page.waitForURL('/**');
	});

	test('can view and enter scores for a match', async ({ page }) => {
		// Navigate to a specific match
		await page.goto(`/matches/${TEST_MATCH_ID}`);

		// Check that the match page loaded
		await expect(page.locator('h1')).toContainText(/Team A|Team B/);

		// Check that the match type is displayed
		await expect(page.getByText(/Match Type:/)).toBeVisible();

		// Enter a score (this will depend on which match type is displayed)
		// For this example, we'll assume it's showing a scorecard with input fields
		const scoreInputs = page.locator('input[type="text"], input[type="number"]');

		// Check if there are score inputs (if the match is not locked)
		const inputCount = await scoreInputs.count();
		if (inputCount > 0) {
			// Enter a score in the first input field
			await scoreInputs.first().fill('4');
			await scoreInputs.first().blur(); // Trigger the blur event to save

			// Wait for potential syncing
			await page.waitForTimeout(1000);

			// Verify the score is still there after a reload
			await page.reload();
			await page.waitForLoadState('networkidle');

			const reloadedInput = page.locator('input[type="text"], input[type="number"]').first();
			await expect(reloadedInput).toHaveValue('4');
		} else {
			// Match is probably locked - verify we're in read-only mode
			await expect(page.getByText(/locked|completed/i)).toBeVisible();
		}
	});

	test('displays offline indicator when offline', async ({ page, context }) => {
		// Navigate to a match
		await page.goto(`/matches/${TEST_MATCH_ID}`);

		// Set the browser to offline mode
		await context.setOffline(true);

		// Check that the offline indicator appears
		await expect(page.getByText('Offline')).toBeVisible();

		// Try to enter a score while offline
		const scoreInputs = page.locator('input[type="text"], input[type="number"]');
		const inputCount = await scoreInputs.count();

		if (inputCount > 0) {
			// Enter a score in the first input field
			await scoreInputs.first().fill('5');
			await scoreInputs.first().blur(); // Trigger the blur event to save

			// Verify the score was updated locally
			await expect(scoreInputs.first()).toHaveValue('5');

			// Set the browser back online
			await context.setOffline(false);

			// Check for syncing indicator (may appear briefly)
			await page.waitForTimeout(1000); // Give time for sync to start

			// Wait for sync to complete
			await page.waitForTimeout(2000);
		}
	});
});

test.describe('Sportsbook Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Go to the login page
		await page.goto('/login');

		// Login
		await page.fill('input[name="username"]', TEST_USERNAME);
		await page.fill('input[name="pin"]', TEST_PIN);
		await page.click('button[type="submit"]');

		// Wait for navigation
		await page.waitForURL('/**');
	});

	test('can view public sportsbook', async ({ page }) => {
		// Navigate to sportsbook
		await page.goto('/sportsbook');

		// Check that the page loaded
		await expect(page.locator('h1')).toContainText('Sportsbook');

		// Check for leaderboard
		await expect(page.getByText(/Money Leaderboard/i)).toBeVisible();

		// Check for bet list
		await expect(page.getByText(/Active & Completed Bets/i)).toBeVisible();
	});

	test('can create and manage bets', async ({ page }) => {
		// Navigate to my-bets
		await page.goto('/my-bets');

		// Check that the page loaded
		await expect(page.locator('h1')).toContainText('My Bets');

		// Click create bet button
		await page.click('button:has-text("Create New Bet")');

		// Fill out the bet form
		await page.fill('input[id="bet-amount"]', '10');
		await page.selectOption('select[id="bet-opponent"]', { index: 1 }); // Select first opponent
		await page.fill('textarea[id="bet-description"]', 'Test bet from e2e test');

		// Select custom resolution type
		await page.check('input[value="custom"]');

		// Submit the form
		await page.click('button[type="submit"]');

		// Wait for the bet to be created and displayed
		await page.waitForSelector('text=Test bet from e2e test');

		// Check if the bet appears in the outgoing tab
		await page.click('button:has-text("Outgoing")');
		await expect(page.getByText('Test bet from e2e test')).toBeVisible();
	});
});

// Skip this test if not run in admin mode with a test account
test.describe.skip('Admin Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Go to the login page with admin credentials
		await page.goto('/login');

		// Login as admin
		await page.fill('input[name="username"]', 'admin');
		await page.fill('input[name="pin"]', 'admin');
		await page.click('button[type="submit"]');

		// Wait for navigation
		await page.waitForURL('/**');

		// Check we have admin access
		await page.goto('/admin');
		await expect(page.url()).toContain('/admin');
	});

	test('can lock and unlock matches', async ({ page }) => {
		// Navigate to admin page
		await page.goto('/admin');

		// Look for match management section
		await expect(page.getByRole('heading', { name: /Matches/i })).toBeVisible();

		// Find a match to lock/unlock
		const lockButtons = page.getByRole('button', { name: /lock|unlock/i });

		if ((await lockButtons.count()) > 0) {
			// Note the current state
			const initialButtonText = await lockButtons.first().innerText();

			// Click to toggle state
			await lockButtons.first().click();

			// Wait for operation to complete
			await page.waitForTimeout(1000);

			// Reload page to verify state change persisted
			await page.reload();

			// Get the button text after reload
			const newLockButton = page.getByRole('button', { name: /lock|unlock/i }).first();
			const newButtonText = await newLockButton.innerText();

			// Button text should be different after toggling
			expect(initialButtonText).not.toBe(newButtonText);
		} else {
			// No matches to lock/unlock - skip test
			test.skip();
		}
	});
});
