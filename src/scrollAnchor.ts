/*
 * Keep the reader's place when switching language.
 * EN and PL lessons have the same structure (same headings, widgets, code blocks, tables),
 * so we remember the Nth structural element at the top of the screen and return to the Nth one.
 */

const ANCHORS = '.lesson h1, .lesson h2, .lesson h3, .lesson figure, .lesson table, .lesson aside, .lesson .dodont, .lesson .chain';

let pending: { index: number; offset: number } | null = null;

const topbar = () => (document.querySelector('.topbar') as HTMLElement | null)?.offsetHeight ?? 0;
const anchors = () => [...document.querySelectorAll<HTMLElement>(ANCHORS)].filter((el) => !el.parentElement?.closest(ANCHORS));

/** Call right before switching language. */
export function rememberScroll() {
  const line = topbar() + 8;
  const els = anchors();
  let index = -1;
  els.forEach((el, i) => {
    if (el.getBoundingClientRect().top <= line) index = i;
  });
  if (index < 0) {
    pending = null;
    return;
  }
  pending = { index, offset: line - els[index].getBoundingClientRect().top };
}

/** Call after the new language's lesson has rendered. */
export function restoreScroll() {
  if (!pending) return;
  const { index, offset } = pending;
  const apply = () => {
    const el = anchors()[index];
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - topbar() - 8 + Math.min(offset, el.offsetHeight);
    window.scrollTo(0, y);
  };
  apply();
  // Strudel editors and widgets finish sizing a moment later; re-apply once they have.
  setTimeout(apply, 400);
  pending = null;
}
