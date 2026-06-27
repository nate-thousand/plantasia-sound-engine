TESTING.md

Plantasia Sound Engine Testing Guide

Status

Current Status: ✅ Working

The sound engine builds successfully, imports correctly as an ES Module, and produces audible sound through the browser demo.

⸻

Requirements

* Node.js 20+
* npm
* Modern browser (Chrome, Edge, Brave, Safari)

⸻

Installation

npm install

⸻

Build

npm run sync-presets   # optional if presets/*.json changed
npm run build

Expected result:

* Build completes with no errors.
* dist/ is generated.
* Package imports successfully.

⸻

Launch Demo

npm run demo

Expected result:

* Vite starts successfully.
* Browser opens automatically (typically http://localhost:5173).

⸻

Browser Test Procedure

1. Verify Engine Loads

Expected status:

Engine loaded

Console:

[plantasia-demo] Engine loaded

⸻

2. Start Audio

Click:

Start Audio

Expected status:

Audio context started

Console:

[plantasia-demo] Audio initialized

⸻

3. Select Preset

Choose any preset.

Expected status:

Preset selected

Console:

[plantasia-demo] Preset selected: <Preset Name>

⸻

4. Play Note

Click:

Play Note

Expected status:

Note playing

Expected behavior:

* Audible sound
* No console errors

⸻

5. Stop Note

Click:

Stop Note

Expected status:

Note stopped

⸻

Regression Checklist

Before every commit verify:

* Engine builds successfully.
* Demo launches.
* Audio starts only after user interaction.
* Presets load correctly.
* Notes play correctly.
* Notes stop correctly.
* No console errors.
* No TypeScript errors.
* No build warnings.
* No broken imports.
* No API changes.

⸻

Smoke Test

Run:

npm install
npm run build
npm run demo

Complete this sequence:

1. Engine loaded
2. Start Audio
3. Select Preset
4. Play Note
5. Stop Note

If all five steps succeed, the build is considered healthy.

⸻

Debugging Checklist

If no sound is heard:

* Verify browser audio is not muted.
* Confirm the Audio Context started after clicking Start Audio.
* Check the browser console for errors.
* Verify the selected preset loaded successfully.
* Confirm the engine output is connected to the destination.
* Confirm the correct note trigger method is being called.
* Restart the demo after rebuilding.

⸻

Release Checklist

Before pushing to GitHub:

* npm install
* npm run build
* npm run demo
* Complete the smoke test
* Verify README is current
* Verify CHANGELOG (if applicable)
* Commit changes

⸻

Current Known Good State

* ES Module imports working
* Browser demo working
* Audio initialization working
* Preset selection working
* Note playback working
* Note stop working
* Status panel functioning
* Console logging enabled
* Ready for integration into Plantasia 2.0

⸻

Examples

Run any example after building:

npm run example:basic
npm run example:presets
npm run example:effects
npm run example:midi
npm run example:sequencing
npm run example:generative