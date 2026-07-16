import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useLogin, useMergeLocalProgress, useRegister } from '../api/auth'
import { Button } from '../components/common/Button'
import { Sigil } from '../components/common/Sigil'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useLocalProgressStore } from '../stores/localProgressStore'

const registerSchema = z
  .object({
    username: z.string().min(3, 'At least 3 characters').max(150),
    email: z.string().email('A valid email is required'),
    password: z.string().min(9, 'At least 9 characters'),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

function fieldErrorsFrom(apiError) {
  if (apiError?.detail && typeof apiError.detail === 'object') {
    return Object.entries(apiError.detail)
      .map(([field, messages]) => `${field}: ${[].concat(messages).join(' ')}`)
      .join(' · ')
  }
  return apiError?.message || 'Something went wrong.'
}

function AuthShell({ title, children, footer }) {
  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <div className="text-center">
        <Sigil size={56} className="text-gold-500 mx-auto" />
        <h1 className="mt-6 font-display font-light text-3xl text-parchment-100">{title}</h1>
      </div>
      <div className="mt-10">{children}</div>
      <p className="mt-8 text-center font-sans text-sm text-parchment-500">{footer}</p>
    </div>
  )
}

const inputClass =
  'mt-1.5 w-full bg-ink-900 border border-ink-600 focus:border-gold-600 rounded-sm px-3 py-2.5 font-sans text-sm text-parchment-100 placeholder:text-parchment-600'

export function LoginPage() {
  useDocumentTitle('Sign in')
  const navigate = useNavigate()
  const login = useLogin()
  const [apiError, setApiError] = useState(null)
  const { register, handleSubmit, formState } = useForm()

  const onSubmit = (values) => {
    setApiError(null)
    login.mutate(values, {
      onSuccess: () => navigate('/home'),
      onError: (error) =>
        setApiError(error.status === 401 ? 'Username and password did not match.' : fieldErrorsFrom(error)),
    })
  }

  return (
    <AuthShell
      title="Return to the archive"
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="text-gold-300 underline decoration-dotted">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <label className="block">
          <span className="caps-label text-parchment-500">Username</span>
          <input type="text" autoComplete="username" {...register('username', { required: true })} className={inputClass} />
        </label>
        <label className="block">
          <span className="caps-label text-parchment-500">Password</span>
          <input type="password" autoComplete="current-password" {...register('password', { required: true })} className={inputClass} />
        </label>
        {apiError && (
          <p role="alert" className="font-sans text-sm text-crimson-300">
            {apiError}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={formState.isSubmitting || login.isPending}>
          {login.isPending ? 'Opening…' : 'Sign in'}
        </Button>
        <p className="font-sans text-xs text-parchment-500 text-center">
          Forgotten password recovery arrives with email delivery — for now, contact the
          administrator of this installation.
        </p>
      </form>
    </AuthShell>
  )
}

export function RegisterPage() {
  useDocumentTitle('Create account')
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const mergeProgress = useMergeLocalProgress()
  const hasLocalProgress = useLocalProgressStore((state) => Object.keys(state.byChapter).length > 0)
  const [apiError, setApiError] = useState(null)
  const { register, handleSubmit, formState, setError } = useForm()

  const onSubmit = (values) => {
    setApiError(null)
    const parsed = registerSchema.safeParse(values)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        setError(issue.path[0], { message: issue.message })
      }
      return
    }
    registerMutation.mutate(
      { username: values.username, email: values.email, password: values.password },
      {
        onSuccess: () => {
          if (hasLocalProgress) mergeProgress.mutate()
          navigate('/home')
        },
        onError: (error) => setApiError(fieldErrorsFrom(error)),
      }
    )
  }

  return (
    <AuthShell
      title="Take a seat in the archive"
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="text-gold-300 underline decoration-dotted">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <label className="block">
          <span className="caps-label text-parchment-500">Username</span>
          <input type="text" autoComplete="username" {...register('username', { required: 'Required' })} className={inputClass} />
          {formState.errors.username && (
            <span className="font-sans text-xs text-crimson-300">{formState.errors.username.message}</span>
          )}
        </label>
        <label className="block">
          <span className="caps-label text-parchment-500">Email</span>
          <input type="email" autoComplete="email" {...register('email', { required: 'Required' })} className={inputClass} />
          {formState.errors.email && (
            <span className="font-sans text-xs text-crimson-300">{formState.errors.email.message}</span>
          )}
        </label>
        <label className="block">
          <span className="caps-label text-parchment-500">Password</span>
          <input type="password" autoComplete="new-password" {...register('password', { required: 'Required' })} className={inputClass} />
          {formState.errors.password && (
            <span className="font-sans text-xs text-crimson-300">{formState.errors.password.message}</span>
          )}
        </label>
        <label className="block">
          <span className="caps-label text-parchment-500">Confirm password</span>
          <input type="password" autoComplete="new-password" {...register('confirm', { required: 'Required' })} className={inputClass} />
          {formState.errors.confirm && (
            <span className="font-sans text-xs text-crimson-300">{formState.errors.confirm.message}</span>
          )}
        </label>
        {apiError && (
          <p role="alert" className="font-sans text-sm text-crimson-300">
            {apiError}
          </p>
        )}
        {hasLocalProgress && (
          <p className="font-sans text-xs text-parchment-500">
            Your reading progress on this device will be offered for merging into the new account.
          </p>
        )}
        <Button type="submit" className="w-full" disabled={formState.isSubmitting || registerMutation.isPending}>
          {registerMutation.isPending ? 'Creating…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  )
}
