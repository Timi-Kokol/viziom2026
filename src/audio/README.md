# Audio

Centralized sound: config, one AudioContext, and `useSound()` for the app.

## Setup

- **Sounds live in** `public/sounds/`.
- **Config** is in `soundConfig.js`: add an id and path, put the file in `public/sounds/`.
- **Provider**: `<SoundProvider>` is mounted in Experience so any child can use `useSound()`.

## Add a new sound

1. Add the file under `public/sounds/` (e.g. `my-sound.ogg`).
2. In `soundConfig.js`:
   - Add an entry to `SOUND_IDS`: `MY_SOUND: "mySound"`.
   - Add to `SOUND_CONFIG`: `[SOUND_IDS.MY_SOUND]: { url: "/sounds/my-sound.ogg", volume: 0.5 }`.
3. In your component: `const { play } = useSound(); play(SOUND_IDS.MY_SOUND);`

## Hook up to interactions

```js
import { useSound, SOUND_IDS } from "../../audio";

function MyComponent() {
  const { play } = useSound();
  return (
    <button
      onMouseEnter={() => play(SOUND_IDS.BUTTON_HOVER)}
      onClick={() => play(SOUND_IDS.BUTTON_PRESS)}
    >
      Click
    </button>
  );
}
```

## Expected files in `public/sounds/`

- `straf.ogg` – strafe left/right
- `jump.ogg` – jump
- `crash.ogg` – crash
- `ui-hover.ogg` – button hover
- `ui-press.ogg` – button press

Use `.mp3` or `.wav` if you prefer; update the `url` in `soundConfig.js`.
