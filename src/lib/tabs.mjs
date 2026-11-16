// WAI-ARIA Tabs pattern: Left/Right/Home/End move focus and activate the next day tab.
// `event.currentTarget` is the tablist container, so the query stays scoped to it.
function dayTabKeyDown(event, keys, day, setDay) {
  const moves = { ArrowRight: 1, ArrowLeft: -1 };
  let next;
  if (event.key in moves) next = keys[(keys.indexOf(day) + moves[event.key] + keys.length) % keys.length];
  else if (event.key === 'Home') next = keys[0];
  else if (event.key === 'End') next = keys[keys.length - 1];
  else return;
  event.preventDefault();
  setDay(next);
  // The target tab is already in the DOM (only its aria-selected/class re-render later), so focus now.
  event.currentTarget.querySelector(`[data-day-tab="${next}"]`)?.focus();
}

export { dayTabKeyDown };
