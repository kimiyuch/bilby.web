// AppSettings.swift: the warning, the sounds, the voice and the volume.

export type Chime = 'none' | 'dingDong' | 'bell' | 'gong' | 'pings';

export const chimeTitles: Record<Chime, string> = {
    none: 'None',
    dingDong: 'Ding-dong',
    bell: 'Bell',
    gong: 'Gong',
    pings: 'Three pings',
};

export interface Settings {
    /** Seconds before the end of a level or break; 0 turns the warning off. */
    warningSeconds: number;
    warningSound: Chime;
    levelSound: Chime;
    breakStartSound: Chime;
    breakEndSound: Chime;
    announce: boolean;
    /** A SpeechSynthesisVoice's voiceURI, or null for the browser's English default. */
    voice: string | null;
    volume: number;
    muted: boolean;
}

export const defaultSettings = (): Settings => ({
    warningSeconds: 60,
    warningSound: 'dingDong',
    levelSound: 'bell',
    breakStartSound: 'gong',
    breakEndSound: 'pings',
    announce: true,
    voice: null,
    volume: 0.8,
    muted: false,
});

/** Every field is optional, so older saved settings keep working when settings are added. */
export function decodeSettings(raw: any): Settings {
    const d = defaultSettings();
    if (!raw || typeof raw !== 'object') return d;
    const chime = (v: unknown, fallback: Chime): Chime => (typeof v === 'string' && v in chimeTitles ? (v as Chime) : fallback);
    return {
        warningSeconds: typeof raw.warningSeconds === 'number' ? raw.warningSeconds : d.warningSeconds,
        warningSound: chime(raw.warningSound, d.warningSound),
        levelSound: chime(raw.levelSound, d.levelSound),
        breakStartSound: chime(raw.breakStartSound, d.breakStartSound),
        breakEndSound: chime(raw.breakEndSound, d.breakEndSound),
        announce: typeof raw.announce === 'boolean' ? raw.announce : d.announce,
        voice: typeof raw.voice === 'string' ? raw.voice : null,
        volume: typeof raw.volume === 'number' ? Math.min(1, Math.max(0, raw.volume)) : d.volume,
        muted: typeof raw.muted === 'boolean' ? raw.muted : d.muted,
    };
}
