// Keyboard input: held keys, edge-triggered presses, and a normalized
// thrust axis. Arrow keys and Space never scroll the page while playing.
const GAME_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space',
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyP', 'KeyR', 'KeyM', 'Enter',
]);

export class Input {
  constructor() {
    this.held = new Set();
    this.pressed = new Set();
    this.onKeyDown = (event) => {
      if (GAME_KEYS.has(event.code)) event.preventDefault();
      if (!event.repeat) this.pressed.add(event.code);
      this.held.add(event.code);
    };
    this.onKeyUp = (event) => {
      this.held.delete(event.code);
    };
    this.onBlur = () => {
      this.held.clear();
    };
  }

  attach() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  axis() {
    let x = 0;
    let y = 0;
    if (this.held.has('ArrowLeft') || this.held.has('KeyA')) x -= 1;
    if (this.held.has('ArrowRight') || this.held.has('KeyD')) x += 1;
    if (this.held.has('ArrowUp') || this.held.has('KeyW')) y -= 1;
    if (this.held.has('ArrowDown') || this.held.has('KeyS')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  get dashPressed() {
    return this.pressed.has('Space') || this.pressed.has('ShiftLeft') || this.pressed.has('ShiftRight');
  }

  get startPressed() {
    return this.pressed.has('Enter') || this.pressed.has('Space');
  }

  endStep() {
    this.pressed.clear();
  }
}
