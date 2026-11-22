import ChessClock from "./ChessClock.js";

export const TIME_CONTROLS = Object.freeze({
  none: Object.freeze({ label: "No clock", initialTimeMs: null, incrementMs: 0 }),
  "3+2": Object.freeze({ label: "3 + 2", initialTimeMs: 180000, incrementMs: 2000 }),
  "5+0": Object.freeze({ label: "5 + 0", initialTimeMs: 300000, incrementMs: 0 }),
  "10+0": Object.freeze({ label: "10 + 0", initialTimeMs: 600000, incrementMs: 0 }),
  "15+10": Object.freeze({ label: "15 + 10", initialTimeMs: 900000, incrementMs: 10000 }),
});

export function createClockForTimeControl(timeControl = "none") {
  const settings = TIME_CONTROLS[timeControl];
  if (!settings) throw new RangeError("Unknown chess time control.");
  if (settings.initialTimeMs === null) return null;
  return new ChessClock(settings);
}
