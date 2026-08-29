import { type Page, expect } from "@playwright/test";

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

    const targetNode = el.querySelector("p") || el;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(targetNode);

    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const selectable =
      el.closest("[data-selectable]") || el.querySelector("[data-selectable]") || el;
    const rect = targetNode.getBoundingClientRect();
    const eventInit = {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    };

    selectable.dispatchEvent(new Event("selectstart", { bubbles: true, cancelable: true }));
    selectable.dispatchEvent(new PointerEvent("pointermove", eventInit));
    selectable.dispatchEvent(new PointerEvent("pointerup", eventInit));
    document.dispatchEvent(new Event("selectionchange", { bubbles: true }));
  }, testId);
}

/**
 * Convenience helper to select text specifically within the post body.
 * Does NOT advance to toolbar; caller asserts native vs toolbar visibility.
 */
export async function selectPostText(page: Page): Promise<void> {
  await selectTextByTestId(page, "post-detail-body");
}

/**
 * Convenience helper to select text specifically within the post body on mobile viewports.
 * Does NOT advance to toolbar; caller must call advanceMobileSelectionToToolbar().
 */
export async function selectMobilePostText(page: Page): Promise<void> {
  await selectTextByTestId(page, "post-detail-body");
}

/**
 * Resolves a stable, non-interactive background tap point outside the
 * selectable content and the popover. Coordinates only — no element tap,
 * so nothing interactive underneath can be activated.
 */
async function backgroundTapPoint(page: Page): Promise<{ x: number; y: number }> {
  const title = page.getByTestId("post-detail-title");
  if (await title.isVisible().catch(() => false)) {
    const box = await title.boundingBox().catch(() => null);
    if (box) return { x: box.x + 5, y: Math.max(5, box.y - 5) };
  }
  // Fallback: top-left viewport corner, padding area
  return { x: 8, y: 8 };
}

/**
 * Advances a mobile native selection to the Quote.Vote toolbar.
 * Performs exactly ONE background tap (a full mouse gesture:
 * pointerdown/up/click). No synthetic extra pointerdown — emitting two
 * gestures would immediately perform the second transition and dismiss
 * the toolbar again (P1 #4).
 */
export async function advanceMobileSelectionToToolbar(page: Page): Promise<void> {
  const { x, y } = await backgroundTapPoint(page);
  await page.mouse.click(x, y);
}

/**
 * Dismisses the retained toolbar with a second background tap.
 * Exactly ONE gesture, same rules as the advance helper.
 */
export async function dismissMobileToolbar(page: Page): Promise<void> {
  const { x, y } = await backgroundTapPoint(page);
  await page.mouse.click(x, y);
}
