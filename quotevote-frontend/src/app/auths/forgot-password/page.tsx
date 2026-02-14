/**
 * Forgot Password Page (Server Component Wrapper)
 * 
 * Server component wrapper for the forgot password page.
 * Migrated from legacy ForgotPasswordPage.jsx.
 */

import ForgotPasswordPageContent from './PageContent';

// Mark this route as dynamic to prevent static optimization issues
export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageContent />;
}
