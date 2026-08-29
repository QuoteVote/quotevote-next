import { type Page, expect } from '@playwright/test';

/**
 * Selects text inside an element specified by a data-testid.
 * Split responsibility (issue #484):
 * - selectTextByTestId / selectPostText only create the DOM selection.
 * - advanceMobileSelectionToToolbar performs the first background tap.
 * Tests own all visibility assertions.
 */
export async function selectTextByTestId(page: Page, testId: string): Promise<void> {
  const container = page.getByTestId(testId);
  await expect(container).toBeVisible({ timeout: 15_000 });

  // 1. Attempt physical mouse/touch selection via bounding box dragging
  const box = await container.boundingBox();
  if (box && box.width > 20 && box.height > 10) {
    const startX = box.x + box.width * 0.1;
    const startY = box.y + box.height * 0.5;
    const endX = box.x + box.width * 0.9;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, startY, { steps: 10 });
    await page.mouse.up();
  }

  // 2. Ensure selection via DOM API and dispatch pointer events to reliably trigger listeners across viewports/devices
  await page.evaluate((selector) => {
    const el = document.querySelector(`[data-testid="${selector}"]`);
    if (!el) return;

    const targetNode = el.querySelector('p') || el;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(targetNode);

    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const selectable = el.closest('[data-selectable]') || el.querySelector('[data-selectable]') || el;
    const rect = targetNode.getBoundingClientRect();
    const eventInit = {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    };

    selectable.dispatchEvent(new Event('selectstart', { bubbles: true, cancelable: true }));
    selectable.dispatchEvent(new PointerEvent('pointermove', eventInit));
    selectable.dispatchEvent(new PointerEvent('pointerup', eventInit));
    document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
  }, testId);
}

/**
 * Convenience helper to select text specifically within the post body.
 * Does NOT advance to toolbar; caller asserts native vs toolbar visibility.
 */
export async function selectPostText(page: Page): Promise<void> {
  await selectTextByTestId(page, 'post-detail-body');
}

/**
 * Convenience helper to select text specifically within the post body on mobile viewports.
 * Does NOT advance to toolbar; caller must call advanceMobileSelectionToToolbar().
 */
export async function selectMobilePostText(page: Page): Promise<void> {
  await selectTextByTestId(page, 'post-detail-body');
}

/**
 * Advances a mobile native selection to the Quote.Vote toolbar.
 * Performs the first outside tap that the delayed workflow requires.
 * Caller should tap a stable, non-interactive page background.
 */
export async function advanceMobileSelectionToToolbar(page: Page): Promise<void> {
  // Tap a stable background outside the selectable content and toolbar.
  // Prefer the page header / body padding. Fallback to coordinates.
  const candidates = [
    page.getByTestId('post-detail-title'),
    page.locator('header').first(),
    page.locator('body'),
  ]
  for (const c of candidates) {
    if (await c.isVisible().catch(() => false)) {
      const box = await c.boundingBox().catch(() => null)
      if (box) {
        // Tap near top outside selectable
        await page.mouse.click(box.x + 5, Math.max(5, box.y + 5))
        // Also dispatch pointerdown for capture handler
        await page.evaluate(() => {
          document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }))
        })
        return
      }
    }
  }
  await page.mouse.click(5, 5)
}

/**
 * Dismisses the retained toolbar with a second background tap.
 */
export async function dismissMobileToolbar(page: Page): Promise<void> {
  await advanceMobileSelectionToToolbar(page)
}
