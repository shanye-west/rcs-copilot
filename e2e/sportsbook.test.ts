import { test, expect } from '@playwright/test';

// Test constants
const TEST_USERNAME = 'testuser';
const TEST_PIN = '1234';

test.describe('Sportsbook Functionality', () => {
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

	test('can view public sportsbook page', async ({ page }) => {
		// Navigate to sportsbook
		await page.goto('/sportsbook');

		// Check that the sportsbook page loaded correctly
		await expect(page.locator('h1')).toContainText(/Sportsbook|Bets/);

		// Check that the leaderboard is displayed
		await expect(page.getByText(/Leaderboard/)).toBeVisible();

		// Check that there are bets listed
		const betElements = page.locator('.bet-card');
		const betCount = await betElements.count();

		// There should be at least one bet, or a message saying no bets
		if (betCount > 0) {
			await expect(betElements.first()).toBeVisible();
		} else {
			await expect(page.getByText(/No active bets|No bets available/)).toBeVisible();
		}
	});

	test('can navigate to my bets page', async ({ page }) => {
		// Navigate to my bets page
		await page.goto('/my-bets');

		// Check that the my bets page loaded correctly
		await expect(page.locator('h1')).toContainText(/My Bets/);

		// Check that the tabs are displayed
		await expect(page.getByRole('tab', { name: /Incoming/ })).toBeVisible();
		await expect(page.getByRole('tab', { name: /Outgoing/ })).toBeVisible();
		await expect(page.getByRole('tab', { name: /Active/ })).toBeVisible();
		await expect(page.getByRole('tab', { name: /Completed/ })).toBeVisible();
	});

	test('can create a new bet', async ({ page }) => {
		// Navigate to sportsbook
		await page.goto('/sportsbook');

		// Click on "Create Bet" button
		await page.getByRole('button', { name: /Create Bet/ }).click();

		// Wait for the create bet modal to appear
		await expect(page.getByText(/Create New Bet/)).toBeVisible();

		// Fill out the bet form - the exact fields will depend on your implementation
		await page.fill('input[name="amount"]', '10');
		await page.fill('textarea[name="description"]', 'Test bet from E2E test');

		// Select opponent (assuming there's a dropdown)
		await page.selectOption('select[name="opponent_id"]', { label: 'Player 2' });

		// Select bet type (assuming there are bet type options)
		await page.click('input[name="bet_type"][value="custom"]');

		// Submit the form
		await page.getByRole('button', { name: /Submit|Create|Save/ }).click();

		// Wait for the confirmation message
		await expect(page.getByText(/Bet created successfully/)).toBeVisible();
	});

	test('can accept an incoming bet', async ({ page }) => {
		// Navigate to my bets page
		await page.goto('/my-bets');

		// Click the "Incoming" tab
		await page.getByRole('tab', { name: /Incoming/ }).click();

		// Check if there are any incoming bets
		const incomingBets = page.locator('.bet-card');
		const betCount = await incomingBets.count();

		if (betCount > 0) {
			// Click the accept button on the first incoming bet
			await page
				.getByRole('button', { name: /Accept/ })
				.first()
				.click();

			// Wait for confirmation
			await expect(page.getByText(/Bet accepted/)).toBeVisible();

			// Check that the bet moved to the Active tab
			await page.getByRole('tab', { name: /Active/ }).click();

			// Find the newly accepted bet
			await expect(page.getByText(/Test bet from E2E test/)).toBeVisible();
		} else {
			console.log('No incoming bets to accept');
		}
	});

	test('can decline an incoming bet', async ({ page }) => {
		// Navigate to my bets page
		await page.goto('/my-bets');

		// Click the "Incoming" tab
		await page.getByRole('tab', { name: /Incoming/ }).click();

		// Check if there are any incoming bets
		const incomingBets = page.locator('.bet-card');
		const betCount = await incomingBets.count();

		if (betCount > 0) {
			// Click the decline button on the first incoming bet
			await page
				.getByRole('button', { name: /Decline|Reject/ })
				.first()
				.click();

			// Wait for confirmation
			await expect(page.getByText(/Bet declined/)).toBeVisible();
		} else {
			console.log('No incoming bets to decline');
		}
	});
});
