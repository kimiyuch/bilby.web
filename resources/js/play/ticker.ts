// A worker that ticks four times a second. Timers in workers keep going when the tab is in the background.
setInterval(() => postMessage(0), 250);
