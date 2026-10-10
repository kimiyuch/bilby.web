// Sounds.swift in the browser: the same synthesized bell tones through Web Audio, and announcements through
// the Web Speech API.

import type { Chime } from './settings';

/** Notes as [frequency, start time]; the timbre is the same for all notes of a chime. */
const notes: Record<Chime, [number, number][]> = {
    none: [],
    dingDong: [[880, 0], [698.46, 0.42]],
    bell: [[523.25, 0], [659.25, 0.14], [783.99, 0.28], [1046.5, 0.42]],
    gong: [[196, 0], [196.9, 0]],
    pings: [[1318.5, 0], [1318.5, 0.28], [1318.5, 0.56]],
};

/** [frequency ratio, amplitude] for each partial, and how fast the note fades. */
const timbres: Record<Chime, { partials: [number, number][]; decay: number }> = {
    none: { partials: [], decay: 1 },
    dingDong: { partials: [[1, 1], [2, 0.25], [3, 0.08]], decay: 0.9 },
    bell: { partials: [[1, 1], [2, 0.45], [3, 0.2], [4.2, 0.08]], decay: 1.2 },
    gong: { partials: [[1, 1], [2, 0.5], [2.76, 0.25], [5.4, 0.06]], decay: 2.6 },
    pings: { partials: [[1, 1], [2.76, 0.12]], decay: 0.35 },
};

function render(chime: Chime, context: BaseAudioContext): AudioBuffer {
    const rate = context.sampleRate;
    const { partials, decay } = timbres[chime];
    const length = Math.max(0, ...notes[chime].map(([, start]) => start)) + decay * 5;
    const frames = Math.ceil(length * rate);
    const buffer = context.createBuffer(1, frames, rate);
    const samples = buffer.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < frames; i++) {
        const t = i / rate;
        let value = 0;
        for (const [frequency, start] of notes[chime]) {
            if (t < start) continue;
            const local = t - start;
            const attack = Math.min(1, local / 0.006);
            for (const [ratio, amplitude] of partials) {
                // Higher partials fade faster, as they do on a real bell.
                const envelope = Math.exp(-local / (decay / Math.sqrt(ratio)));
                value += amplitude * envelope * Math.sin(2 * Math.PI * frequency * ratio * local);
            }
            value *= attack;
        }
        samples[i] = value;
        peak = Math.max(peak, Math.abs(value));
    }
    if (peak > 0) for (let i = 0; i < frames; i++) samples[i] *= 0.6 / peak;
    return buffer;
}

/** Plays chimes and speaks announcements. Browsers only allow sound after the page was clicked or typed in. */
export class SoundPlayer {
    private context: AudioContext | null = null;
    private buffers = new Map<Chime, AudioBuffer>();
    private current: AudioBufferSourceNode | null = null;
    private pendingSpeech: number | undefined;

    /** Whether the browser lets the page play sound yet. */
    get isUnlocked(): boolean {
        return this.context?.state === 'running';
    }

    /** Call from a click or key press: creates or resumes the audio context and wakes up speech. */
    unlock(): Promise<void> {
        const context = this.audio();
        // iOS Safari only speaks after a first utterance from a user gesture.
        if (!this.spokeOnce && 'speechSynthesis' in window) {
            this.spokeOnce = true;
            const silent = new SpeechSynthesisUtterance('');
            silent.volume = 0;
            speechSynthesis.speak(silent);
        }
        return context?.resume().catch(() => {}) ?? Promise.resolve();
    }

    private spokeOnce = false;

    /** Plays `chime`, then speaks `text` once the chime has mostly faded. */
    play(chime: Chime, text: string | null, volume: number, voice: string | null): void {
        window.clearTimeout(this.pendingSpeech);
        let delay = 0;
        const context = this.audio();
        if (chime !== 'none' && context) {
            let buffer = this.buffers.get(chime);
            if (!buffer) {
                buffer = render(chime, context);
                this.buffers.set(chime, buffer);
            }
            this.current?.stop();
            const source = context.createBufferSource();
            const gain = context.createGain();
            gain.gain.value = volume;
            source.buffer = buffer;
            source.connect(gain).connect(context.destination);
            source.start();
            this.current = source;
            delay = Math.max(...notes[chime].map(([, start]) => start)) + 0.7;
        }
        if (!text) return;
        this.pendingSpeech = window.setTimeout(() => this.speak(text, volume, voice), delay * 1000);
    }

    speak(text: string, volume: number, voice: string | null): void {
        if (!('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = SoundPlayer.voices();
        utterance.voice = voices.find((v) => v.voiceURI === voice) ?? voices.find((v) => v.lang === 'en-US') ?? voices[0] ?? null;
        utterance.lang = utterance.voice?.lang ?? 'en-US';
        utterance.volume = volume;
        utterance.rate = 0.95;
        speechSynthesis.speak(utterance);
    }

    /** English voices; local ones first, since they also work offline. */
    static voices(): SpeechSynthesisVoice[] {
        if (!('speechSynthesis' in window)) return [];
        return speechSynthesis
            .getVoices()
            .filter((v) => v.lang.toLowerCase().startsWith('en'))
            .sort((a, b) => Number(b.localService) - Number(a.localService) || a.name.localeCompare(b.name));
    }

    private audio(): AudioContext | null {
        if (this.context) return this.context;
        const Context = window.AudioContext ?? (window as any).webkitAudioContext;
        if (!Context) return null;
        this.context = new Context();
        return this.context;
    }
}
