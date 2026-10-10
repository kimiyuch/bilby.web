// What the Mac and iPhone extras do, as far as a browser can: keep the screen awake while the clock runs,
// show the countdown in the tab title (instead of the menu bar), and the keyboard shortcuts.

import { watchEffect } from 'vue';
import { TimeFormat } from './kit/format';
import * as store from './store';

/** Keeps the display awake while the clock runs. The lock is dropped when the tab is hidden, so take it again. */
export function keepAwake(): void {
    if (!('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let requesting = false;

    const update = async () => {
        const wanted = store.isRunning.value && document.visibilityState === 'visible';
        if (wanted && !lock && !requesting) {
            requesting = true;
            try {
                lock = await navigator.wakeLock.request('screen');
                lock.addEventListener('release', () => (lock = null));
            } catch {
                // Not allowed right now (e.g. low battery); try again on the next change.
            } finally {
                requesting = false;
            }
        } else if (!wanted && lock) {
            await lock.release();
            lock = null;
        }
    };
    store.onChange(update);
    document.addEventListener('visibilitychange', update);
}

/** "12:34 · Level 5" in the tab title while a tournament is on, like the menu bar countdown on the Mac. */
export function titleCountdown(): void {
    const base = document.title;
    watchEffect(() => {
        const s = store.snapshot(store.now.value);
        if (!s.hasStarted || s.isFinished) {
            document.title = base;
            return;
        }
        const what = s.levelNumber ? `Level ${s.levelNumber}` : 'Break';
        document.title = `${TimeFormat.countdown(s.remaining)} · ${what}${s.isRunning ? '' : ' (paused)'}`;
    });
}

/**
 * Space, arrows and M, unless the focus is in a form field or a dialog. Space always starts and pauses, even
 * when a button still has the focus from a click (Enter presses buttons).
 */
export function installShortcuts(): void {
    window.addEventListener('keydown', (event) => {
        if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return;
        const target = event.target as HTMLElement | null;
        if (target?.closest('input, textarea, select, [contenteditable], dialog, [role=menu]')) return;
        const actions: Record<string, () => void> = {
            ' ': store.toggle,
            ArrowRight: store.next,
            ArrowLeft: store.previous,
            ArrowUp: () => store.adjust(1),
            ArrowDown: () => store.adjust(-1),
            m: () => (store.settings.muted = !store.settings.muted),
            M: () => (store.settings.muted = !store.settings.muted),
        };
        const action = actions[event.key];
        if (!action) return;
        event.preventDefault();
        action();
    });
}
