'use client';

import { useActionState, useState } from 'react';
import {
  deleteMenuAction,
  moveMenuAction,
  saveMenuAction,
  seedMenusAction,
  type ActionState,
} from './actions';
import type { MenuItem } from '../lib/defaults';
import { Note, SubmitButton } from './widgets';

export default function MenusPanel({ menus, canUpload }: { menus: MenuItem[]; canUpload: boolean }) {
  const [editing, setEditing] = useState<MenuItem | 'new' | null>(null);
  const [saveState, saveAction] = useActionState<ActionState, FormData>(saveMenuAction, {});
  const [listState, listAction] = useActionState<ActionState, FormData>(
    async (prev: ActionState, formData: FormData) => {
      const intent = formData.get('intent');
      if (intent === 'delete') return deleteMenuAction(prev, formData);
      if (intent === 'seed') return seedMenusAction();
      return moveMenuAction(prev, formData);
    },
    {},
  );

  return (
    <>
      <header>
        <h2>Menus</h2>
        <p>
          The list of menus on the home page. Upload a photo or PDF of each menu and it opens when a
          visitor taps the row. Change one here and the site shows it on the next page load.
        </p>
      </header>

      {!canUpload ? (
        <div className="admin-banner">
          <h3>File uploads are not switched on yet</h3>
          <p>
            You can still add, rename, and reorder menus, and point each one at a web address. To
            upload menu photos and PDFs directly, the file storage has to be provisioned first.
          </p>
        </div>
      ) : null}

      {editing === null ? (
        <div className="admin-actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 0, marginBottom: '1.25rem' }}>
          <button type="button" className="admin-button" onClick={() => setEditing('new')}>
            Add a menu
          </button>
          <Note state={listState} />
        </div>
      ) : (
        <MenuForm
          menu={editing === 'new' ? null : editing}
          canUpload={canUpload}
          action={saveAction}
          state={saveState}
          onClose={() => setEditing(null)}
        />
      )}

      {menus.length === 0 ? (
        <form className="admin-empty" action={listAction}>
          <input type="hidden" name="intent" value="seed" />
          <p style={{ marginTop: 0 }}>
            No menus saved yet, so the site is showing its six built-in categories: Lunch, Dinner,
            Dessert, Drinks, Wine, and Kids &amp; platters.
          </p>
          <SubmitButton variant="quiet" pendingLabel="Copying…">
            Copy those six here so I can edit them
          </SubmitButton>
        </form>
      ) : (
        <div className="admin-list">
          {menus.map((menu, index) => (
            <div className="admin-item" key={menu.id}>
              <div>
                <h4>
                  {menu.title}
                  {menu.status === 'draft' ? <span className="admin-tag">Hidden</span> : null}
                  {menu.fileKey ? (
                    <span className="admin-tag admin-tag-file">
                      {menu.fileType === 'application/pdf' ? 'PDF' : 'Photo'}
                    </span>
                  ) : null}
                </h4>
                <p>{menu.blurb || 'No description.'}</p>
              </div>
              <div className="admin-item-tools">
                <form action={listAction}>
                  <input type="hidden" name="id" value={menu.id} />
                  <input type="hidden" name="direction" value="up" />
                  <SubmitButton variant="tiny" pendingLabel="…" disabled={index === 0} aria-label={`Move ${menu.title} up`}>
                    ↑
                  </SubmitButton>
                </form>
                <form action={listAction}>
                  <input type="hidden" name="id" value={menu.id} />
                  <input type="hidden" name="direction" value="down" />
                  <SubmitButton
                    variant="tiny"
                    pendingLabel="…"
                    disabled={index === menus.length - 1}
                    aria-label={`Move ${menu.title} down`}
                  >
                    ↓
                  </SubmitButton>
                </form>
                <button type="button" className="admin-button admin-button-quiet admin-button-tiny" onClick={() => setEditing(menu)}>
                  Edit
                </button>
                <form
                  action={listAction}
                  onSubmit={(event) => {
                    if (!confirm(`Remove “${menu.title}” from the site?`)) event.preventDefault();
                  }}
                >
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="id" value={menu.id} />
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

function MenuForm({
  menu,
  canUpload,
  action,
  state,
  onClose,
}: {
  menu: MenuItem | null;
  canUpload: boolean;
  action: (formData: FormData) => void;
  state: ActionState;
  onClose: () => void;
}) {
  return (
    <form className="admin-card" action={action}>
      <h3>{menu ? `Edit “${menu.title}”` : 'Add a menu'}</h3>
      <p>Menus appear on the home page in the order shown below.</p>

      {menu ? <input type="hidden" name="id" value={menu.id} /> : null}

      <div className="admin-field">
        <label htmlFor="menu-title">Name</label>
        <input id="menu-title" name="title" type="text" defaultValue={menu?.title ?? ''} required />
      </div>

      <div className="admin-field">
        <label htmlFor="menu-blurb">Description</label>
        <p className="admin-help">One line describing what is on this menu.</p>
        <textarea id="menu-blurb" name="blurb" defaultValue={menu?.blurb ?? ''} />
      </div>

      <div className="admin-field">
        <label htmlFor="menu-file">Menu file</label>
        <p className="admin-help">
          A photo or PDF of the menu, up to 10 MB.
          {menu?.fileKey ? ' Leave this empty to keep the file already attached.' : ''}
        </p>
        <input
          id="menu-file"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf"
          disabled={!canUpload}
        />
        {menu?.fileKey ? (
          <p className="admin-help" style={{ marginTop: '0.45rem' }}>
            Currently attached:{' '}
            <a href={`/uploads/${menu.fileKey}`} target="_blank" rel="noreferrer">
              view the current file
            </a>
          </p>
        ) : null}
      </div>

      <div className="admin-field">
        <label htmlFor="menu-link">Or link to a web address</label>
        <p className="admin-help">
          Used when there is no file attached — for example a menu hosted somewhere else.
        </p>
        <input id="menu-link" name="link_url" type="url" defaultValue={menu?.linkUrl ?? ''} />
      </div>

      <div className="admin-field">
        <label htmlFor="menu-status">Show on the site</label>
        <select id="menu-status" name="status" defaultValue={menu?.status ?? 'published'}>
          <option value="published">Yes — visitors can see it</option>
          <option value="draft">No — hide it for now</option>
        </select>
      </div>

      <div className="admin-actions">
        <SubmitButton>{menu ? 'Save menu' : 'Add menu'}</SubmitButton>
        <button type="button" className="admin-button admin-button-quiet" onClick={onClose}>
          Cancel
        </button>
        <Note state={state} />
      </div>
    </form>
  );
}
