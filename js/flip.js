// flip.js — optional "grow from the clicked node" entrance polish for #card.
// No-ops entirely under prefers-reduced-motion (movement is the one thing
// reduced-motion users don't get; render.js still gives them an opacity
// crossfade via CSS, independent of this module).

function reducedMotion() {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (_) {
    return false;
  }
}

/**
 * Animate `cardEl` growing from `triggerEl`'s on-screen box to its own final
 * box. Call AFTER the card's new content/layout has been applied (so the
 * "final box" measurement is correct); this only touches `transform`/
 * `opacity`, never layout properties.
 */
export function flipCardFrom(triggerEl, cardEl) {
  if (reducedMotion() || !triggerEl || !cardEl) return;
  if (!document.contains(triggerEl)) return;

  const from = triggerEl.getBoundingClientRect();
  const to = cardEl.getBoundingClientRect();
  if (!from.width || !from.height || !to.width || !to.height) return;

  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const sx = Math.max(0.2, from.width / to.width);
  const sy = Math.max(0.2, from.height / to.height);

  // #card is pinned to the board center with translate(-50%,-50%); that base
  // MUST be preserved in every transform we set, otherwise the card jumps by
  // half its own size (down + right) and the entrance appears to fly in from
  // the wrong direction (e.g. the top `work` node reading as "from the right").
  cardEl.style.transition = 'none';
  cardEl.style.transformOrigin = 'center center';
  cardEl.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  cardEl.style.opacity = '0.35';

  // Force the browser to paint the "from" state before animating, then
  // release on the next frame so it transitions to identity.
  cardEl.getBoundingClientRect();
  requestAnimationFrame(() => {
    cardEl.style.transition = 'transform var(--t-med) var(--ease), opacity var(--t-fast) linear';
    cardEl.style.transform = 'translate(-50%, -50%) scale(1)';
    cardEl.style.opacity = '';
    const clear = () => {
      cardEl.style.transition = '';
      cardEl.style.transform = '';
      cardEl.style.transformOrigin = '';
      cardEl.removeEventListener('transitionend', clear);
    };
    cardEl.addEventListener('transitionend', clear);
  });
}

/**
 * flipCardEnter — the generic card entrance used when there is no source
 * element to grow from (returning home via a background click or Esc). A
 * small settle-in from center + fade so every view change — including back
 * to home — reads as a switch, not a jump cut.
 * No-op under reduced motion (CSS still crossfades ring/wheel).
 */
export function flipCardEnter(cardEl) {
  if (reducedMotion() || !cardEl) return;

  cardEl.style.transition = 'none';
  cardEl.style.transformOrigin = 'center center';
  cardEl.style.transform = 'translate(-50%, -50%) scale(.94)';
  cardEl.style.opacity = '0.4';

  cardEl.getBoundingClientRect();
  requestAnimationFrame(() => {
    cardEl.style.transition = 'transform var(--t-med) var(--ease), opacity var(--t-fast) linear';
    // #card is centered with translate(-50%,-50%); restoring that (not '')
    // keeps it pinned while the scale settles to 1.
    cardEl.style.transform = 'translate(-50%, -50%) scale(1)';
    cardEl.style.opacity = '';
    const clear = () => {
      cardEl.style.transition = '';
      cardEl.style.transform = '';
      cardEl.style.transformOrigin = '';
      cardEl.removeEventListener('transitionend', clear);
    };
    cardEl.addEventListener('transitionend', clear);
  });
}
