'use client';

import { useActionState } from 'react';
import { signInAction, type ActionState } from './actions';
import { SubmitButton } from './widgets';

export default function SignIn() {
  const [state, formAction] = useActionState<ActionState, FormData>(signInAction, {});

  return (
    <div className="admin-gate">
      <form action={formAction}>
        <h1>Jeff’s</h1>
        <p>Website content panel</p>

        <div className="admin-field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" autoFocus />
        </div>

        <SubmitButton>Sign in</SubmitButton>

        {state.error ? <p className="admin-note admin-note-bad">{state.error}</p> : null}
      </form>
    </div>
  );
}
