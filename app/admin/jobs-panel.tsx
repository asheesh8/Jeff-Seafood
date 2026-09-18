'use client';

import { useActionState, useState } from 'react';
import { deleteJobAction, saveJobAction, seedJobsAction, type ActionState } from './actions';
import type { JobItem } from '../lib/defaults';
import { Note, SubmitButton } from './widgets';

export default function JobsPanel({ jobs }: { jobs: JobItem[] }) {
  const [editing, setEditing] = useState<JobItem | 'new' | null>(null);
  const [saveState, saveAction] = useActionState<ActionState, FormData>(saveJobAction, {});
  const [listState, listAction] = useActionState<ActionState, FormData>(
    async (prev: ActionState, formData: FormData) =>
      formData.get('intent') === 'seed' ? seedJobsAction() : deleteJobAction(prev, formData),
    {},
  );

  return (
    <>
      <header>
        <h2>Jobs</h2>
        <p>
          The openings listed on the Jobs page. Hide a position when it is filled instead of deleting
          it, and it is ready to switch back on next time.
        </p>
      </header>

      {editing === null ? (
        <div className="admin-actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 0, marginBottom: '1.25rem' }}>
          <button type="button" className="admin-button" onClick={() => setEditing('new')}>
            Add a position
          </button>
          <Note state={listState} />
        </div>
      ) : (
        <JobForm
          job={editing === 'new' ? null : editing}
          action={saveAction}
          state={saveState}
          onClose={() => setEditing(null)}
        />
      )}

      {jobs.length === 0 ? (
        <form className="admin-empty" action={listAction}>
          <input type="hidden" name="intent" value="seed" />
          <p style={{ marginTop: 0 }}>
            No positions saved yet, so the Jobs page is showing the two built-in postings: Line Cook
            and Dishwasher.
          </p>
          <SubmitButton variant="quiet" pendingLabel="Copying…">
            Copy those two here so I can edit them
          </SubmitButton>
        </form>
      ) : (
        <div className="admin-list">
          {jobs.map((job) => (
            <div className="admin-item" key={job.id}>
              <div>
                <h4>
                  {job.title}
                  {job.status === 'draft' ? <span className="admin-tag">Hidden</span> : null}
                </h4>
                <p>{job.schedule || 'No schedule listed.'}</p>
              </div>
              <div className="admin-item-tools">
                <button type="button" className="admin-button admin-button-quiet admin-button-tiny" onClick={() => setEditing(job)}>
                  Edit
                </button>
                <form
                  action={listAction}
                  onSubmit={(event) => {
                    if (!confirm(`Remove “${job.title}” from the Jobs page?`)) event.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={job.id} />
                  <SubmitButton variant="danger" pendingLabel="…">Remove</SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function JobForm({
  job,
  action,
  state,
  onClose,
}: {
  job: JobItem | null;
  action: (formData: FormData) => void;
  state: ActionState;
  onClose: () => void;
}) {
  return (
    <form className="admin-card" action={action}>
      <h3>{job ? `Edit “${job.title}”` : 'Add a position'}</h3>
      <p>Everything here shows on the Jobs page exactly as you write it.</p>

      {job ? <input type="hidden" name="id" value={job.id} /> : null}

      <div className="admin-field">
        <label htmlFor="job-title">Position</label>
        <input id="job-title" name="title" type="text" defaultValue={job?.title ?? ''} required />
      </div>

      <div className="admin-row">
        <div className="admin-field">
          <label htmlFor="job-schedule">Shifts</label>
          <input
            id="job-schedule"
            name="schedule"
            type="text"
            defaultValue={job?.schedule ?? ''}
            placeholder="AM &amp; PM shifts · Full-time or part-time"
          />
        </div>
        <div className="admin-field">
          <label htmlFor="job-experience">Experience needed</label>
          <input
            id="job-experience"
            name="experience"
            type="text"
            defaultValue={job?.experience ?? ''}
            placeholder="Kitchen experience preferred."
          />
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="job-duties">What you’ll do</label>
        <p className="admin-help">One duty per line. Each line becomes a bullet point.</p>
        <textarea
          id="job-duties"
          name="duties"
          className="admin-tall"
          defaultValue={job?.duties.join('\n') ?? ''}
        />
      </div>

      <div className="admin-field">
        <label htmlFor="job-apply">Apply button link (optional)</label>
        <p className="admin-help">
          Leave this empty and the Apply button takes people to the application form further down the
          Jobs page, which emails you their answers. Only fill it in to send them somewhere else.
        </p>
        <input id="job-apply" name="apply_url" type="url" defaultValue={job?.applyUrl ?? ''} />
      </div>

      <div className="admin-field">
        <label htmlFor="job-status">Show on the site</label>
        <select id="job-status" name="status" defaultValue={job?.status ?? 'published'}>
          <option value="published">Yes — we are hiring for this</option>
          <option value="draft">No — the position is filled</option>
        </select>
      </div>

      <div className="admin-actions">
        <SubmitButton>{job ? 'Save position' : 'Add position'}</SubmitButton>
        <button type="button" className="admin-button admin-button-quiet" onClick={onClose}>
          Cancel
        </button>
        <Note state={state} />
      </div>
    </form>
  );
}
