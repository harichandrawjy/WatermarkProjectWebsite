import { Icon } from '@iconify/react'

interface AuthShellProps {
  /** Iconify name for the eyebrow pill. */
  icon: string
  eyebrow: string
  title: string
  lead?: string
  children: React.ReactNode
}

/**
 * The centred header + narrow column shared by Login, Register and
 * ForgotPassword. Previously each page hand-rolled its own copy of this
 * markup, which is why their spacing had quietly drifted apart.
 */
export default function AuthShell({ icon, eyebrow, title, lead, children }: AuthShellProps) {
  return (
    <div className="page-narrow pt-24 pb-32 animate-fade-up">
      <div className="text-center mb-9">
        <span className="pill-accent mb-5">
          <Icon icon={icon} width="13" />
          {eyebrow}
        </span>
        <h1 className="font-display text-3xl text-ink-hi mb-3">{title}</h1>
        {lead && <p className="text-base text-ink-lo">{lead}</p>}
      </div>
      {children}
    </div>
  )
}

interface AuthNoticeProps {
  icon: string
  tone?: 'ok' | 'accent'
  title: string
  children: React.ReactNode
  action: { label: string; onClick: () => void }
}

/** Terminal state of an auth flow — "check your inbox", "password updated". */
export function AuthNotice({ icon, tone = 'ok', title, children, action }: AuthNoticeProps) {
  const ring = tone === 'ok' ? 'border-ok-line text-ok' : 'border-accent-line text-accent'
  return (
    <div className={`card p-8 text-center ${tone === 'ok' ? 'border-ok-line' : ''}`}>
      <span className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-5 ${ring}`}>
        <Icon icon={icon} width="24" />
      </span>
      <h2 className="font-display text-xl text-ink-hi mb-2.5">{title}</h2>
      <div className="text-base text-ink-lo leading-relaxed mb-7">{children}</div>
      <button onClick={action.onClick} className="btn-primary btn-block">
        {action.label}
      </button>
    </div>
  )
}

/** Inline form error strip. */
export function AuthError({ message }: { message: string }) {
  return (
    <div className="callout-alert">
      <Icon icon="lucide:alert-circle" width="15" className="text-alert shrink-0 mt-0.5" />
      {message}
    </div>
  )
}
