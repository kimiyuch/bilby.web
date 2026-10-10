<script setup lang="ts">
// Warning time, the sound for each moment, spoken announcements and volume (SoundSettings.swift).
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { previewChime, previewVoice, voices } from '../alerts';
import { type Chime, chimeTitles } from '../settings';
import * as store from '../store';
import Icon from './Icon.vue';

const s = store.settings;

const chimes = Object.entries(chimeTitles) as [Chime, string][];
const moments: { key: 'warningSound' | 'levelSound' | 'breakStartSound' | 'breakEndSound'; title: string }[] = [
    { key: 'warningSound', title: 'Warning' },
    { key: 'levelSound', title: 'New level' },
    { key: 'breakStartSound', title: 'Break starts' },
    { key: 'breakEndSound', title: 'Break ends' },
];

// Voices load asynchronously in some browsers.
const voiceList = ref(voices());
const refresh = () => (voiceList.value = voices());
onMounted(() => window.speechSynthesis?.addEventListener('voiceschanged', refresh));
onBeforeUnmount(() => window.speechSynthesis?.removeEventListener('voiceschanged', refresh));

const voiceName = (v: SpeechSynthesisVoice) => {
    let region = v.lang;
    try {
        region = new Intl.DisplayNames(undefined, { type: 'language' }).of(v.lang) ?? v.lang;
    } catch {
        // Keep the code.
    }
    return `${v.name}, ${region}`;
};
</script>

<template>
    <div class="mx-auto max-w-3xl px-6 pb-16 lg:px-8">
        <p class="eyebrow">Settings</p>
        <h1 class="mt-1 font-display text-3xl font-semibold tracking-tight text-chip-950">Sounds and voice</h1>

        <section class="mt-10">
            <h2 class="section-title pb-2">Warning</h2>
            <div class="row border-t border-neutral-950/10">
                <label for="warning" class="text-sm/6 font-medium text-neutral-700">Warn before the end</label>
                <select id="warning" v-model.number="s.warningSeconds" class="field w-40">
                    <option :value="0">Off</option>
                    <option :value="30">30 seconds</option>
                    <option :value="60">1 minute</option>
                    <option :value="120">2 minutes</option>
                    <option :value="300">5 minutes</option>
                </select>
            </div>
            <p class="border-t border-neutral-950/5 py-3 text-xs/5 text-neutral-500">The clock turns amber and the warning sound plays.</p>
        </section>

        <section class="mt-10">
            <h2 class="section-title pb-2">Sounds</h2>
            <div class="divide-y divide-neutral-950/5 border-t border-neutral-950/10">
                <div v-for="m in moments" :key="m.key" class="row">
                    <label :for="m.key" class="text-sm/6 font-medium text-neutral-700">{{ m.title }}</label>
                    <div class="flex items-center gap-x-2">
                        <select :id="m.key" v-model="s[m.key]" class="field w-40">
                            <option v-for="[value, title] in chimes" :key="value" :value="value">{{ title }}</option>
                        </select>
                        <button type="button" class="btn btn-plain btn-icon" :aria-label="`Play ${chimeTitles[s[m.key]]}`" :disabled="s[m.key] === 'none'" @click="previewChime(s[m.key])">
                            <Icon name="play" />
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <section class="mt-10">
            <h2 class="section-title pb-2">Voice</h2>
            <div class="divide-y divide-neutral-950/5 border-t border-neutral-950/10">
                <label class="row cursor-pointer">
                    <span class="text-sm/6 font-medium text-neutral-700">Announce levels and breaks</span>
                    <input v-model="s.announce" type="checkbox" class="size-5 accent-ochre-500">
                </label>
                <div class="row">
                    <label for="voice" class="text-sm/6 font-medium text-neutral-700">Voice</label>
                    <select id="voice" v-model="s.voice" class="field w-56 truncate sm:w-72" :disabled="!s.announce">
                        <option :value="null">Browser default</option>
                        <option v-for="v in voiceList" :key="v.voiceURI" :value="v.voiceURI">{{ voiceName(v) }}</option>
                    </select>
                </div>
                <div class="row">
                    <span class="text-xs/5 text-neutral-500">For example: “Level 6. Blinds 150, 300, ante 300.”</span>
                    <button type="button" class="btn" :disabled="!s.announce" @click="previewVoice">Try the voice</button>
                </div>
            </div>
        </section>

        <section class="mt-10">
            <h2 class="section-title pb-2">Volume</h2>
            <div class="divide-y divide-neutral-950/5 border-t border-neutral-950/10">
                <div class="row">
                    <Icon name="speaker-x-mark" class="size-5 shrink-0 text-neutral-400" />
                    <input v-model.number="s.volume" type="range" min="0" max="1" step="0.05" class="flex-1 accent-ochre-500" aria-label="Volume" :disabled="s.muted">
                    <Icon name="speaker-wave" class="size-5 shrink-0 text-neutral-400" />
                </div>
                <label class="row cursor-pointer">
                    <span class="text-sm/6 font-medium text-neutral-700">Mute</span>
                    <input v-model="s.muted" type="checkbox" class="size-5 accent-ochre-500">
                </label>
            </div>
        </section>

        <p class="mt-8 text-sm/6 text-pretty text-neutral-500">
            Bilby keeps everything in this browser: the tournament, your structures and these settings. Nothing is sent anywhere.
            Browsers only play sound after you click on the page, and some slow down background tabs, so keep Bilby open in its own window during a game.
        </p>
    </div>
</template>
