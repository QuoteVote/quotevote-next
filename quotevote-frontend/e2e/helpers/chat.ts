import { expect, type Page } from '@playwright/test';

/** Opens the Messages panel from the desktop header or mobile bottom nav. */
export async function openMessagesPanel(page: Page, isMobile: boolean): Promise<void> {
  if (isMobile) {
    await page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .getByRole('button', { name: 'Messages' })
      .click();
  } else {
    await page.getByTestId('desktop-messages-button').click();
  }

  await expect(page.getByTestId('chat-page').locator('visible=true')).toBeVisible();
}

export async function selectMessagesTab(
  page: Page,
  tab: 'Chats' | 'Discussions' | 'Buddies'
): Promise<void> {
  const chatPage = page.getByTestId('chat-page').locator('visible=true');
  await chatPage.getByRole('tab', { name: tab }).click();
}

export function atHandleFromPerson(person: {
  username: string;
  name?: string | null;
}): string {
  const nameWord = person.name?.trim().split(/\s+/)[0];
  const handle = (nameWord || person.username).toLowerCase();
  return `@${handle}`;
}
