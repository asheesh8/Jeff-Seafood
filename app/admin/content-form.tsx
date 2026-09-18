'use client';

import { useActionState } from 'react';
import { resetGroupAction, saveContentAction, type ActionState } from './actions';
import type { Content } from '../lib/content';
import type { FieldDef, GroupDef } from '../lib/defaults';
import { Note, SubmitButton } from './widgets';

export default function ContentForm({ group, content }: { group: GroupDef; content: Content }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveContentAction, {});
  const [resetState, resetAction] = useActionState<ActionState, FormData>(resetGroupAction, {});

  return (
    <>
      <header>
        <h2>{group.label}</h2>
        <p>{group.blurb}</p>
      </header>

      <form className="admin-card" action={formAction}>
        <input type="hidden" name="group" value={group.id} />

        {group.fields.map((field) => (
          <Field key={field.key} field={field} value={content[field.key] ?? ''} />
        ))}

        <div className="admin-actions">
          <SubmitButton>Save changes</SubmitButton>
          <Note state={state} />
        </div>
      </form>

      <form className="admin-card" action={resetAction}>
        <input type="hidden" name="group" value={group.id} />
        <h3>Start this section over</h3>
        <p>
          Puts every field above back to the wording the site launched with. Your other sections are
          not touched.
        </p>
        <div className="admin-actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
          <SubmitButton variant="quiet" pendingLabel="Restoring…">
            Restore original wording
          </SubmitButton>
          <Note state={resetState} />
        </div>
      </form>
    </>
  );
}

function Field({ field, value }: { field: FieldDef; value: string }) {
  const id = field.key;

  if (field.type === 'toggle') {
    return (
      <div className="admin-field admin-check">
        <input id={id} name={field.key} type="checkbox" defaultChecked={value === 'true'} />
        <label htmlFor={id}>{field.label}</label>
      </div>
    );
  }

  if (field.type === 'image') {
    return (
      <div className="admin-field">
        <label htmlFor={id}>{field.label}</label>
        {field.help ? <p className="admin-help">{field.help}</p> : null}
        <div className="admin-image">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" />
            <figcaption>{value || 'No photo set'}</figcaption>
          </figure>
          <div>
            <input
              type="file"
              name={`${field.key}__file`}
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            />
            <p className="admin-help" style={{ margin: '0.5rem 0 0.35rem' }}>
              Choose a photo to replace this one, or type a path below if the photo is already on the
              site.
            </p>
            <input id={id} name={field.key} type="text" defaultValue={value} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-field">
      <label htmlFor={id}>{field.label}</label>
      {field.help ? <p className="admin-help">{field.help}</p> : null}
      {field.type === 'text' ? (
        <input id={id} name={field.key} type="text" defaultValue={value} />
      ) : (
        <textarea
          id={id}
          name={field.key}
          defaultValue={value}
          className={field.type === 'textarea' ? 'admin-tall' : undefined}
          rows={field.type === 'lines' ? 4 : undefined}
        />
      )}
    </div>
  );
}
