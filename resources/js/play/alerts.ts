// Alerts.swift: turns clock events into sounds and announcements, following the settings. Only one window
// plays them, so a second tab doesn’t double every chime.

import { ref } from 'vue';
import type { ClockEvent } from './kit/clock';
import { Announcement } from './kit/format';
import { type Structure, isBreak } from './kit/structure';
import type { Chime, Settings } from './settings';
import { SoundPlayer } from './sound';
import { onClockEvent, settings, tournament } from './store';

const sounds = new SoundPlayer();
/** True while the browser still blocks sound because nobody has clicked or typed on the page yet. */
export const soundBlocked = ref(true);
let isSoundWindow = false;

export function alertFor(event: ClockEvent, structure: Structure, s: Settings): [Chime, string] {
    const rounds = structure.rounds;
    const round = rounds[event.roundIndex];
    if (!round) return ['none', ''];
    switch (event.kind) {
        case 'warning':
            return [s.warningSound, Announcement.warning(round, s.warningSeconds)];
        case 'roundStarted': {
            const previous = event.roundIndex > 0 ? rounds[event.roundIndex - 1] : null;
            const chime = isBreak(round) ? s.breakStartSound : previous && isBreak(previous) ? s.breakEndSound : s.levelSound;
            return [chime, Announcement.roundStarted(event.roundIndex, structure)];
        }
        case 'finished':
            return [s.levelSound, Announcement.finished];
    }
}

/** Starts playing alerts in this window, unless another window already does. */
export function installAlerts(): void {
    const claim = () => {
        isSoundWindow = true;
    };
    if ('locks' in navigator) {
        // Held until the window closes; then the next window in line takes over.
        navigator.locks.request('bilby-sounds', () => {
            claim();
            return new Promise(() => {});
        });
    } else {
        claim();
    }

    onClockEvent((event) => {
        if (!isSoundWindow || settings.muted) return;
        const [chime, text] = alertFor(event, tournament.value.structure, settings);
        sounds.play(chime, settings.announce ? text : null, settings.volume, settings.voice);
    });

    const unlock = () => {
        sounds.unlock().then(() => (soundBlocked.value = !sounds.isUnlocked));
    };
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
}

/** Plays a sound regardless of mute, for trying them out in settings. */
export function previewChime(chime: Chime): void {
    sounds.unlock();
    sounds.play(chime, null, settings.volume, null);
}

export function previewVoice(): void {
    sounds.unlock();
    const structure = tournament.value.structure;
    const index = Math.max(0, structure.rounds.findIndex((r) => r.ante > 0));
    sounds.speak(Announcement.roundStarted(index, structure), settings.volume, settings.voice);
}

export const voices = () => SoundPlayer.voices();
