'use client'

import { useState, useCallback, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation } from '@apollo/client/react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { AccessField } from '@/components/Access/AccessField'
import { DisplayAvatar } from '@/components/DisplayAvatar'
import ChangePasswordDialog from '@/components/settings/ChangePasswordDialog'
import { UPDATE_USER } from '@/graphql/mutations'
import { GET_USER } from '@/graphql/queries'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'
import { useAppStore } from '@/store/useAppStore'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import type { SettingsUserData } from '@/types/settings'
import type { UpdateUserResponse } from '@/types/test'

const settingsSchema = z.object({
  email: z.string().trim().email('Please enter a valid email'),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

const noopSubscribe = () => () => {}

/**
 * Settings (#536): account and app preferences only. Photo, name, username,
 * About and banner are edited from the profile (Edit profile). Sign out lives
 * in the account menu. The password is changed from Account, in its own dialog.
 */
export default function SettingsPageClient() {
  const userData = useAppStore((state) => state.user.data) as SettingsUserData | undefined
  const setUserData = useAppStore((state) => state.setUserData)
  const { setTheme, isDarkMode, neoBrutalism, toggleNeoBrutalism } = useTheme()

  const username = userData?.username ?? ''
  const email = userData?.email ?? ''
  const userId = userData?.id ?? userData?._id ?? ''

  const [localDarkMode, setLocalDarkMode] = useState(isDarkMode)
  const [originalDarkMode, setOriginalDarkMode] = useState(isDarkMode)
  const [localBrutalism, setLocalBrutalism] = useState(neoBrutalism)
  // The theme comes from localStorage, which the server can't read, so the
  // switches, icon and labels show the saved theme only after hydration.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const darkShown = hydrated && localDarkMode
  const brutalismShown = hydrated && localBrutalism

  const [updateUser, { loading }] = useMutation<UpdateUserResponse>(UPDATE_USER)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { email },
    values: { email },
    resetOptions: { keepDirtyValues: true, keepErrors: true },
  })

  useEffect(() => {
    setLocalDarkMode(isDarkMode)
  }, [isDarkMode])

  const handleThemeToggle = useCallback(
    (checked: boolean) => {
      setTheme(checked ? 'dark' : 'light')
      setLocalDarkMode(checked)
    },
    [setTheme]
  )

  const handleBrutalismToggle = useCallback(() => {
    const next = toggleNeoBrutalism()
    setLocalBrutalism(next)
  }, [toggleNeoBrutalism])

  const themeDirty = localDarkMode !== originalDarkMode
  const isFormDirty = form.formState.isDirty || themeDirty

  const onSubmit = async (values: SettingsFormValues) => {
    const userInput: Record<string, unknown> = {
      _id: userId,
      themePreference: localDarkMode ? 'dark' : 'light',
    }
    if (form.formState.dirtyFields.email) userInput.email = values.email

    try {
      const result = await updateUser({
        variables: { user: userInput },
        refetchQueries: [{ query: GET_USER, variables: { username } }],
        awaitRefetchQueries: true,
      })
      const updated = result.data?.updateUser
      if (updated) {
        setUserData({
          ...userData,
          ...updated,
          avatar: userData?.avatar as string | undefined,
          themePreference: localDarkMode ? 'dark' : 'light',
        })
        setOriginalDarkMode(localDarkMode)
        toast.success('Settings saved')
        form.reset({ email: updated.email ?? values.email })
      }
    } catch (err) {
      const message = replaceGqlError(err instanceof Error ? err.message : 'Failed to save settings')
      if (/email/i.test(message)) {
        form.setError('email', { message }, { shouldFocus: true })
      } else {
        toast.error(message)
      }
    }
  }

  const errors = form.formState.errors
  const [section, setSection] = useState<'account' | 'appearance'>('account')
  const panel =
    'rounded-[18px] border border-[var(--inv-panel-line)] bg-[var(--auth-surface)] shadow-[var(--inv-panel-shadow)] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2'
  const row = 'flex items-center gap-4 border-b border-[var(--inv-row-line)] py-[18px]'
  const icon = (d: React.ReactNode) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {d}
    </svg>
  )

  return (
    <div className="qv-auth qv-pub min-h-[calc(100dvh-var(--app-header-h))] bg-[var(--inv-ground)]! font-redesign">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-6 px-4 pb-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-9 xl:grid-cols-[240px_minmax(0,1fr)_380px] xl:px-0">
        <aside aria-label="Settings sections" className="flex flex-col gap-1 pt-6 max-lg:hidden lg:pt-9">
          <p className="qv-auth-eyebrow mb-2.5! ml-3.5">Settings</p>
          <a href="#account" className="qv-settings-nav" aria-current={section === 'account' ? 'true' : undefined} onClick={() => setSection('account')}>
            {icon(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>)}
            Account
          </a>
          <a href="#appearance" className="qv-settings-nav" aria-current={section === 'appearance' ? 'true' : undefined} onClick={() => setSection('appearance')}>
            {icon(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>)}
            Appearance
          </a>
          <Link href={username ? `/profile/${username}/edit` : '/profile'} className="qv-settings-nav">
            {icon(<path d="M4 20h4L19 9l-4-4L4 16z" />)}
            Edit profile
          </Link>
          <Link href={username ? `/profile/${username}/avatar` : '/profile'} className="qv-settings-nav">
            {icon(<><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01" /></>)}
            Avatar
          </Link>
          <div className="mx-3.5 my-3 h-px bg-[var(--inv-panel-line)]" />
          <Link href="/logout" className="qv-settings-nav text-[#a12424]! [&>svg]:text-[#a12424]!">
            {icon(<path d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H3" />)}
            Sign out
          </Link>
        </aside>

        <main className="flex min-w-0 flex-col gap-[18px] pt-6 lg:pt-9">
          <div>
            <h1 className="qv-auth-display m-0 text-[32px]! lg:text-[38px]!">Settings</h1>
            <p className="qv-auth-muted mt-1.5 mb-0 font-semibold">Your account and app preferences.</p>
          </div>

          <Link
            href={username ? `/profile/${username}/edit` : '/profile'}
            data-testid="settings-edit-profile-link"
            className={cn(panel, 'flex items-center gap-4 px-5 py-4 text-[var(--auth-ink)] no-underline hover:border-[var(--auth-line-hover)]')}
          >
            <DisplayAvatar
              avatar={userData?.avatar as string | Record<string, unknown> | undefined}
              username={(typeof userData?.name === 'string' && userData.name) || username}
              size={44}
            />
            <div className="flex-1">
              <b>Edit profile</b>
              <br />
              <span className="qv-auth-hint font-semibold">Photo, name, username, About and banner</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[var(--auth-muted)]" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>

          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[18px]">
            <section id="account" aria-labelledby="settings-account-heading" className={cn(panel, 'scroll-mt-24 px-6 pt-1.5 pb-2')}>
              <h2 id="settings-account-heading" className="qv-auth-display m-0 pt-[18px] pb-1.5 text-[22px]! tracking-[-0.02em]!">
                Account
              </h2>
              <div className="border-b border-[var(--inv-row-line)] pt-2.5 pb-[18px]">
                <AccessField
                  id="settings-email"
                  type="email"
                  label="Email"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...form.register('email')}
                />
              </div>
              <div className={cn(row, 'flex-wrap border-b-0')}>
                <div className="min-w-[200px] flex-1">
                  <b className="text-[15px]">Password</b>
                  <br />
                  <span className="qv-auth-hint font-semibold">Change the password you sign in with.</span>
                </div>
                <ChangePasswordDialog userId={userId} username={username} />
              </div>
            </section>

            <section id="appearance" aria-labelledby="settings-appearance-heading" className={cn(panel, 'scroll-mt-24 px-6 pt-1.5 pb-5')}>
              <h2 id="settings-appearance-heading" className="qv-auth-display m-0 pt-[18px] pb-0.5 text-[22px]! tracking-[-0.02em]!">
                Appearance
              </h2>
              <div className={row}>
                <div className="flex-1">
                  <b className="text-[15px]" id="dark-mode-label">Dark mode</b>
                  <br />
                  <span className="qv-auth-hint font-semibold">{darkShown ? 'Dark mode is on' : 'Dark mode is off'}</span>
                </div>
                <button
                  type="button"
                  id="dark-mode"
                  role="switch"
                  aria-checked={darkShown}
                  aria-label="Dark mode"
                  className="qv-switch"
                  onClick={() => handleThemeToggle(!localDarkMode)}
                />
              </div>
              <div className={cn(row, 'border-b-0')}>
                <div className="flex-1">
                  <b className="text-[15px]">Neo-Brutalism</b>
                  <br />
                  <span className="qv-auth-hint font-semibold">Bold borders, hard shadows, chunky type</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={brutalismShown}
                  aria-label="Neo-Brutalism"
                  className="qv-switch"
                  onClick={handleBrutalismToggle}
                />
              </div>
              <div className="flex gap-3 pb-[18px]" aria-hidden="true">
                <div className="flex flex-1 flex-col gap-2 rounded-[14px] border border-[var(--inv-panel-line)] bg-[var(--auth-surface)] p-3">
                  <span className="qv-auth-eyebrow m-0">Standard</span>
                  <div className="qv-lit h-[52px] rounded-[12px]!" />
                </div>
                <div className="flex flex-1 flex-col gap-2 rounded-[14px] border-[3px] border-[#0f172a] bg-[#fff7dd] p-3 shadow-[5px_5px_0_#0f172a]">
                  <span className="qv-auth-eyebrow m-0 text-[#0f172a]!">
                    Neo-Brutalism{brutalismShown ? ' · on' : ''}
                  </span>
                  <div className="h-12 rounded-[6px] border-[3px] border-b-8 border-[#0f172a] bg-white shadow-[5px_5px_0_#56b3ff]" />
                </div>
              </div>
              <div className="flex justify-end border-t border-[var(--inv-row-line)] pt-4">
                <button type="submit" disabled={!isFormDirty || loading} className="qv-auth-btn qv-auth-btn-primary px-[26px]!">
                  {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Save changes
                </button>
              </div>
            </section>
          </form>
        </main>
        <span className="max-xl:hidden" aria-hidden="true" />
      </div>
    </div>
  )
}
