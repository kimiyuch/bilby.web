// Bilby in the browser. The tournament logic in ./kit is a port of the apps' BilbyKit package; everything else
// is the browser's take on the app around it.

import { createApp } from 'vue';
import { installAlerts } from './alerts';
import App from './components/App.vue';
import { installShortcuts, keepAwake, titleCountdown } from './platform';
import { startTicking } from './store';

// /play?screen is the big screen window: just the clock, which follows the main window.
const screen = new URLSearchParams(location.search).has('screen');

startTicking();
installShortcuts();
keepAwake();
if (!screen) {
    installAlerts();
    titleCountdown();
}

const root = document.getElementById('app')!;
root.replaceChildren();
createApp(App, { screen }).mount(root);

// Works offline once it has been opened: a card room's wifi shouldn't stop the clock.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/play-sw.js', { scope: '/play' }).catch(() => {});
}
