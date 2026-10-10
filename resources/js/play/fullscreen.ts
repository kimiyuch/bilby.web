// Full screen for an element, with a fallback for browsers that can't (Safari on the iPhone): the element is
// then pinned over the whole page instead.

import { onBeforeUnmount, onMounted, type Ref, ref } from 'vue';

/** Safari tints its toolbar with the page's theme color. */
function themeColor(color: string) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}

export function useFullScreen(element: Readonly<Ref<HTMLElement | undefined>>) {
    const isFullScreen = ref(false);
    /** True while the fallback is in use. */
    const pinned = ref(false);

    const update = () => {
        isFullScreen.value = document.fullscreenElement === element.value || pinned.value;
        // The browser keeps its safe areas (next to the notch, under the toolbar) and shows the page's background
        // there; play.css colors it like the clock while it's pinned.
        document.documentElement.classList.toggle('clock-pinned', pinned.value);
        themeColor(pinned.value ? '#101316' : '#fdf8ef');
    };

    const enter = async () => {
        const el = element.value;
        if (!el) return;
        if (document.fullscreenEnabled && el.requestFullscreen) {
            try {
                await el.requestFullscreen({ navigationUI: 'hide' });
                return;
            } catch {
                // Fall through to pinning.
            }
        }
        pinned.value = true;
        update();
    };

    const exit = async () => {
        if (pinned.value) {
            pinned.value = false;
            update();
        } else if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => {});
        }
    };

    const toggle = () => (isFullScreen.value ? exit() : enter());

    const escape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && pinned.value) exit();
    };

    onMounted(() => {
        document.addEventListener('fullscreenchange', update);
        window.addEventListener('keydown', escape);
    });
    onBeforeUnmount(() => {
        document.documentElement.classList.remove('clock-pinned');
        themeColor('#fdf8ef');
        document.removeEventListener('fullscreenchange', update);
        window.removeEventListener('keydown', escape);
    });

    return { isFullScreen, pinned, toggle, enter, exit };
}
