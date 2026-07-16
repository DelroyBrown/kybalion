import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

import { useDeleteAccount, useExportData, useLogout, useMergeLocalProgress, useProfile, useUpdateProfile } from '../api/auth'
import { Button } from '../components/common/Button'
import { Modal } from '../components/common/Modal'
import { EmptyState } from '../components/common/states'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuthStore } from '../stores/authStore'
import { useLocalProgressStore } from '../stores/localProgressStore'
import { formatDate } from '../utils/format'

export function ProfilePage() {
  useDocumentTitle('Profile')
  const navigate = useNavigate()
  const authed = useAuthStore((state) => Boolean(state.access))
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const logout = useLogout()
  const deleteAccount = useDeleteAccount()
  const exportData = useExportData()
  const mergeProgress = useMergeLocalProgress()
  const localEntries = useLocalProgressStore((state) => Object.keys(state.byChapter).length)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { register, handleSubmit, formState } = useForm({
    values: { email: profile?.email || '', first_name: profile?.first_name || '' },
  })

  if (!authed) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <EmptyState
          title="No account on this device"
          body="Sign in to manage your profile, or continue reading anonymously — the text asks nothing of you."
          actionLabel="Sign in"
          actionTo="/login"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-5 sm:px-8 py-12">
      <h1 className="font-display font-light text-3xl text-parchment-100">Profile</h1>
      {profile && (
        <p className="mt-2 font-sans text-sm text-parchment-500">
          {profile.username} · reader since {formatDate(profile.date_joined)}
        </p>
      )}

      <form
        className="mt-10 space-y-5"
        onSubmit={handleSubmit((values) => updateProfile.mutate(values))}
      >
        <label className="block">
          <span className="caps-label text-parchment-500">Email</span>
          <input
            type="email"
            {...register('email')}
            className="mt-1.5 w-full bg-ink-900 border border-ink-600 focus:border-gold-600 rounded-sm px-3 py-2.5 font-sans text-sm text-parchment-100"
          />
        </label>
        <label className="block">
          <span className="caps-label text-parchment-500">Display name (optional)</span>
          <input
            type="text"
            {...register('first_name')}
            className="mt-1.5 w-full bg-ink-900 border border-ink-600 focus:border-gold-600 rounded-sm px-3 py-2.5 font-sans text-sm text-parchment-100"
          />
        </label>
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={formState.isSubmitting || updateProfile.isPending}>
            Save changes
          </Button>
          {updateProfile.isSuccess && <span className="font-sans text-xs text-parchment-500">Saved</span>}
        </div>
      </form>

      {localEntries > 0 && (
        <section className="mt-12 border hairline rounded-sm p-5">
          <h2 className="caps-label text-gold-400">Local reading progress found</h2>
          <p className="editorial-body mt-2 text-parchment-400">
            This device holds progress for {localEntries} chapter{localEntries === 1 ? '' : 's'} from
            before you signed in. Merge it into your account?
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => mergeProgress.mutate()}
            disabled={mergeProgress.isPending}
          >
            {mergeProgress.isPending ? 'Merging…' : 'Merge into my account'}
          </Button>
          {mergeProgress.isSuccess && (
            <p className="mt-2 font-sans text-xs text-gold-300">Merged {mergeProgress.data?.merged} chapters.</p>
          )}
        </section>
      )}

      <section className="mt-12 space-y-3">
        <h2 className="caps-label text-gold-400">Account</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => exportData.mutate()} disabled={exportData.isPending}>
            {exportData.isPending ? 'Preparing…' : 'Export my data'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/home') })}
          >
            Sign out
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete account
          </Button>
        </div>
      </section>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete account">
        <p className="editorial-body">
          This permanently deletes your account and everything in it — notes, highlights,
          bookmarks, journal entries, and reading history. The action cannot be undone. Consider
          exporting your data first.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Keep my account
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteAccount.mutate(undefined, { onSuccess: () => navigate('/') })}
          >
            Delete everything
          </Button>
        </div>
      </Modal>
    </div>
  )
}
