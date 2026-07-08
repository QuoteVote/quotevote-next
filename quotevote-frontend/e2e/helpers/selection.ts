import { type Page, expect } from '@playwright/test';

/**
 * Selects text inside an element specified by a data-testid.
 * Supports both desktop mouse selection and mobile viewport behavior.
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

    selectable.dispatchEvent(new PointerEvent('pointermove', eventInit));
    selectable.dispatchEvent(new PointerEvent('pointerup', eventInit));
    document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
  }, testId);
}

/**
 * Convenience helper to select text specifically within the post body.
 */
export async function selectPostText(page: Page): Promise<void> {
  await selectTextByTestId(page, 'post-detail-body');
}
