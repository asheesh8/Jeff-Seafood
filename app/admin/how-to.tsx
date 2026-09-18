export default function HowTo() {
  return (
    <>
      <header>
        <h2>How this works</h2>
        <p>A short guide to the panel. Nothing here changes the site.</p>
      </header>

      <div className="admin-card">
        <div className="admin-flow">
          <div>
            <strong>1. You edit here</strong>
            <span>/admin — this panel</span>
          </div>
          <div className="admin-flow-arrow" aria-hidden="true">→</div>
          <div>
            <strong>2. It saves</strong>
            <span>Straight to the site’s database</span>
          </div>
          <div className="admin-flow-arrow" aria-hidden="true">→</div>
          <div>
            <strong>3. It’s live</strong>
            <span>On the next page load</span>
          </div>
        </div>
        <p className="admin-note admin-note-ok">
          Changes are instant. Save here, refresh the website, and it is there — nobody has to
          redeploy anything.
        </p>
      </div>

      <div className="admin-card">
        <h3>The four things you can change</h3>

        <details>
          <summary>We’re closed Thursday for a private event — how do I say so?</summary>
          <p>
            Open <strong>Announcement bar</strong>, tick “Show the bar”, write the message, and save.
            A coral strip appears across the top of every page. Untick the box when it no longer
            applies.
          </p>
        </details>

        <details>
          <summary>How do I put a new menu up?</summary>
          <p>
            Open <strong>Menus</strong> → <strong>Add a menu</strong>. Give it a name, a one-line
            description, and attach a photo or PDF of the menu (up to 10 MB). Visitors tap the row on
            the home page and the file opens.
          </p>
          <p>
            To replace an existing menu, click <strong>Edit</strong> on it and attach the new file.
            Leaving the file box empty keeps the one that is already there. Use the arrows to change
            the order they appear in.
          </p>
        </details>

        <details>
          <summary>Our hours changed for the season.</summary>
          <p>
            <strong>Hours &amp; visiting</strong> holds the opening hours, the closed days, and the
            address. Changing them here updates the Visit section and the hours shown in the corner
            of the opening photo at the same time.
          </p>
        </details>

        <details>
          <summary>A position is filled.</summary>
          <p>
            Open <strong>Jobs</strong> → <strong>Edit</strong> → set “Show on the site” to{' '}
            <em>No — the position is filled</em>. It disappears from the Jobs page but stays here,
            ready to switch back on. If no positions are showing, the page tells visitors to call.
          </p>
        </details>
      </div>

      <div className="admin-card">
        <h3>Good to know</h3>

        <details>
          <summary>I made a mess of a section. Can I undo it?</summary>
          <p>
            <strong>Announcement bar</strong> and <strong>Hours &amp; visiting</strong> each have a{' '}
            <strong>Restore original wording</strong> button at the bottom. It puts that one section
            back to how the site launched and leaves everything else alone.
          </p>
        </details>

        <details>
          <summary>What do the boxes that say “one per line” mean?</summary>
          <p>
            Each line you type becomes its own item on the page. In the address box, each line is a
            line of the address; in the extra hours notes, each line is its own note.
          </p>
        </details>

        <details>
          <summary>Can I work from my phone?</summary>
          <p>
            Yes. Go to the same <code>/admin</code> address in your phone browser. The menu along the
            top scrolls sideways, and menu photos can come straight from your camera roll.
          </p>
        </details>

        <details>
          <summary>Who can get in here?</summary>
          <p>
            Anyone with the password. Share it only with people who should be changing the website,
            and ask for it to be changed if someone leaves. Signing out is in the bottom-left corner.
          </p>
        </details>

        <details>
          <summary>I want to change something that isn’t in this panel.</summary>
          <p>
            The rest of the site — the photos, the story, the headings, the phone number and footer —
            is set and does not need touching day to day. Get in touch if any of it needs to change
            and we will update it for you.
          </p>
        </details>

        <details>
          <summary>Something looks wrong on the site after I saved.</summary>
          <p>
            Refresh the page first — you may be looking at a copy your browser saved. If it still
            looks wrong, use <strong>Restore original wording</strong> on that section, then make the
            change again more slowly.
          </p>
        </details>
      </div>
    </>
  );
}
