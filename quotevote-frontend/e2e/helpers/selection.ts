import { type Page, expect } from "@playwright/test";

export async function selectTextByTestId(page: Page, testId: string): Promise<void> {
  const container = page.getByTestId(testId);
  await expect(container).toBeVisible({ timeout: 15_000 });

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

export async function selectPostText(page: Page): Promise<void> {
  await selectTextByTestId(page, "post-detail-body");
}

export async function selectMobilePostText(page: Page): Promise<void> {
  await selectTextByTestId(page, "post-detail-body");
}

async function backgroundTapPoint(page: Page): Promise<{ x: number; y: number }> {
  const title = page.getByTestId("post-detail-title");
  if (await title.isVisible().catch(() => false)) {
    const box = await title.boundingBox().catch(() => null);
    if (box) return { x: box.x + 5, y: Math.max(5, box.y - 5) };
  }
  return { x: 8, y: 8 };
}

export async function advanceMobileSelectionToToolbar(page: Page): Promise<void> {
  const { x, y } = await backgroundTapPoint(page);
  await page.mouse.click(x, y);
}

export async function dismissMobileToolbar(page: Page): Promise<void> {
  const { x, y } = await backgroundTapPoint(page);
  await page.mouse.click(x, y);
}
