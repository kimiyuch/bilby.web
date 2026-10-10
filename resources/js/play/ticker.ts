// A worker timer: posts back once the number of milliseconds in the last message has passed. Timers in workers
// keep going when the tab is in the background.
let timer: ReturnType<typeof setTimeout> | undefined;
onmessage = (event: MessageEvent<number>) => {
    clearTimeout(timer);
    timer = setTimeout(() => postMessage(0), event.data);
};
