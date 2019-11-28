function key(code, span) {
  return {
    code: code,
    span: span || 1,
  };
}

function offset(span) {
  return key(null, span);
}

export const qwerty = [
  [
    key("Digit1"),
    key("Digit2"),
    key("Digit3"),
    key("Digit4"),
    key("Digit5"),
    key("Digit6"),
    key("Digit7"),
    key("Digit8"),
    key("Digit9"),
    key("Digit0"),
    key("Minus"),
    key("Equal"),
  ],
  [
    offset(0.5),
    key("KeyQ"),
    key("KeyW"),
    key("KeyE"),
    key("KeyR"),
    key("KeyT"),
    key("KeyY"),
    key("KeyU"),
    key("KeyI"),
    key("KeyO"),
    key("KeyP"),
    key("BracketLeft"),
    key("BracketRight"),
  ],
  [
    offset(0.8),
    key("KeyA"),
    key("KeyS"),
    key("KeyD"),
    key("KeyF"),
    key("KeyG"),
    key("KeyH"),
    key("KeyJ"),
    key("KeyK"),
    key("KeyL"),
    key("Semicolon"),
    key("Quote"),
  ],
  [
    offset(1),
    key("KeyZ"),
    key("KeyX"),
    key("KeyC"),
    key("KeyV"),
    key("KeyB"),
    key("KeyN"),
    key("KeyM"),
    key("Comma"),
    key("Period"),
    key("Slash"),
    key("ShiftRight", 1.5),
  ],
];

