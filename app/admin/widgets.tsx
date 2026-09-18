'use client';

import { useFormStatus } from 'react-dom';
import type { ActionState } from './actions';

/** A submit button that disables itself and reports progress while pending. */
export function SubmitButton({
  children,
  variant = 'primary',
  pendingLabel,
  ...rest
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'quiet' | 'danger' | 'tiny';
  pendingLabel?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();

  const className = [
    'admin-button',
    variant === 'quiet' ? 'admin-button-quiet' : '',
    variant === 'danger' ? 'admin-button-danger' : '',
    variant === 'tiny' ? 'admin-button-quiet admin-button-tiny' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="submit" className={className} disabled={pending} {...rest}>
      {pending ? (pendingLabel ?? 'Saving…') : children}
    </button>
  );
}

export function Note({ state }: { state: ActionState }) {
  if (state.error) return <p className="admin-note admin-note-bad">{state.error}</p>;
  if (state.ok) return <p className="admin-note admin-note-ok">{state.ok}</p>;
  return null;
}
