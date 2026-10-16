import { useState } from 'react'
import { login } from '../api/client'

export default function Login({ onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const session = await login(email.trim(), password, mfaCode.trim() || undefined)
      onAuthenticated(session.user)
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#070b11] flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md border border-white/[0.08] bg-[#0b1119] rounded-xl p-8 shadow-2xl">
        <p className="text-[#39FF6A] text-[11px] font-semibold uppercase tracking-[0.24em]">CycloSec ThreatOps</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Sign in to the SOC console</h1>
        <p className="mt-2 text-sm text-slate-400">Use your CycloSec account. Access is limited to your authorized tenant.</p>

        {error && <div role="alert" className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>}

        <label className="mt-6 block text-xs font-medium text-slate-300" htmlFor="login-email">Email</label>
        <input id="login-email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#39FF6A]/60" />

        <label className="mt-4 block text-xs font-medium text-slate-300" htmlFor="login-password">Password</label>
        <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#39FF6A]/60" />

        <label className="mt-4 block text-xs font-medium text-slate-300" htmlFor="login-mfa">MFA code <span className="text-slate-500">(if enabled)</span></label>
        <input id="login-mfa" inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={event => setMfaCode(event.target.value)} className="mt-2 w-full rounded-lg border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#39FF6A]/60" />

        <button type="submit" disabled={isSubmitting} className="mt-6 w-full rounded-lg bg-[#39FF6A] px-4 py-2.5 text-sm font-semibold text-[#061009] disabled:cursor-not-allowed disabled:opacity-50">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}