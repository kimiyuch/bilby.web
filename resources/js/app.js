// Makes the clock mock on the home page tick: it counts down, turns amber in the last minute and moves on to
// the next level, like the app does.

const levels = [
    { title: 'LEVEL 6', blinds: '150 / 300', ante: 'Big blind ante 300', next: '200 / 400 · 400', minutes: 20 },
    { title: 'LEVEL 7', blinds: '200 / 400', ante: 'Big blind ante 400', next: 'Break · 15 min', minutes: 20 },
    { title: 'BREAK', blinds: 'Color up the 25s', ante: '', next: '300 / 600 · 600', minutes: 15 },
    { title: 'LEVEL 8', blinds: '300 / 600', ante: 'Big blind ante 600', next: '400 / 800 · 800', minutes: 20 },
];

const format = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds / 60) % 60;
    const s = String(seconds % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

for (const clock of document.querySelectorAll('[data-clock]')) {
    const part = (name) => clock.querySelector(`[data-clock-${name}]`);
    let index = 0;
    let remaining = Number(clock.dataset.remaining);
    let elapsed = 7125;

    const untilBreak = () => {
        let total = remaining;
        for (let i = index + 1; i < levels.length && levels[i].title !== 'BREAK'; i++) total += levels[i].minutes * 60;
        return levels[index].title === 'BREAK' || index + 1 >= levels.length ? '–' : format(total);
    };

    const render = () => {
        const level = levels[index];
        const duration = level.minutes * 60;
        clock.dataset.state = level.title === 'BREAK' ? 'break' : remaining <= 60 ? 'ending' : 'play';
        part('title').textContent = level.title;
        part('time').textContent = format(remaining);
        part('blinds').textContent = level.blinds;
        part('ante').textContent = level.ante || ' ';
        part('next').textContent = level.next;
        part('break').textContent = untilBreak();
        part('elapsed').textContent = format(elapsed);
        part('progress').style.width = `${Math.max(2, (1 - remaining / duration) * 100)}%`;
    };

    setInterval(() => {
        elapsed += 1;
        remaining -= 1;
        if (remaining < 0) {
            index = (index + 1) % levels.length;
            remaining = levels[index].minutes * 60;
        }
        render();
    }, 1000);
}
