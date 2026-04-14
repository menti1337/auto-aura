"use strict";

const Vec3 = require("tera-vec3");

module.exports = function autoAuras(mod) {
	let locking = false;
	let lockingTimerId = null;
	let playerLocation = null;
	let playerDirection = null;
	let timerId = null;
	let intervalId = null;

	mod.game.initialize("me.abnormalities");

	mod.command.add("autoaura", () => {
		mod.settings.enabled = !mod.settings.enabled;
		mod.command.message(`auto-aura ${mod.settings.enabled ? "Enabled" : "Disabled"}.`);
	});

	mod.hook("S_SPAWN_ME", 3, { "order": Infinity }, event => {
		playerLocation = event.loc;
		playerDirection = event.w;

		if (isEnabled() && event.alive) {
			if (intervalId) {
				mod.clearInterval(intervalId);
				intervalId = null;
			}
			mod.setTimeout(() => enableAuras(), 3000);
		}
	});

	mod.hook("C_REVIVE_NOW", 2, () => {
		if (!isEnabled()) return;
		if (intervalId) {
			mod.clearInterval(intervalId);
			intervalId = null;
		}
		mod.setTimeout(() => enableAuras(), 3000);
	});

	mod.hook("C_PLAYER_LOCATION", 5, { "order": Infinity }, event => {
		playerLocation = event.loc;
		playerDirection = event.w;
	});

	mod.hook("S_ACTION_STAGE", 9, { "order": -Infinity, "filter": { "fake": null } }, event => {
		if (!isEnabled() || !mod.game.me.is(event.gameId)) return;

		mod.clearTimeout(lockingTimerId);
		locking = true;
	});

	mod.hook("S_ACTION_END", 5, { "order": -Infinity, "filter": { "fake": null } }, event => {
		if (!isEnabled() || !mod.game.me.is(event.gameId)) return;

		mod.clearTimeout(lockingTimerId);
		lockingTimerId = mod.setTimeout(() => locking = false, 300);
	});

	mod.hook("C_CANCEL_SKILL", 3, { "order": -Infinity }, () => {
		if (!isEnabled()) return;

		mod.clearTimeout(lockingTimerId);
		locking = false;
	});

	function isEnabled() {
		return mod.settings.enabled && mod.game.me.class === "elementalist";
	}

	function enableAuras() {
		if (intervalId) return;

		mod.clearTimeout(timerId);
		timerId = null;

		mod.command.message("Enabling auto-auras");

		intervalId = mod.setInterval(() => {
			// Aura of the Merciless
			if (hasNoAbn([700600, 700601, 700602, 700603])) {
				startSkill(130400);
			}

			// Aura of the Unyielding
			if (hasNoAbn([700203, 700233])) {
				startSkill(150400);
			}

			// Thrall Augmentation
			if (hasNoAbn([702000, 702005])) {
				startSkill(450100);
			}

			if (!hasNoAbn([700600, 700601, 700602, 700603]) &&
				!hasNoAbn([700203, 700233]) &&
				!hasNoAbn([702000, 702005])
			) {
				mod.clearInterval(intervalId);
				intervalId = null;
			}
		}, 100);

		timerId = mod.setTimeout(() => {
			if (intervalId) {
				mod.clearInterval(intervalId);
				intervalId = null;
			}
		}, 8000);
	}

	function hasNoAbn(abnormalities) {
		return Object.keys(mod.game.me.abnormalities).filter(a => abnormalities.includes(Number(a))).length === 0;
	}

	function startSkill(skillId) {
		if (locking || !playerLocation) return;

		mod.clearTimeout(lockingTimerId);
		locking = true;

		mod.send("C_START_SKILL", 7, {
			"skill": {
				"reserved": 0,
				"npc": false,
				"type": 1,
				"huntingZoneId": 0,
				"id": skillId
			},
			"loc": playerLocation,
			"w": playerDirection,
			"dest": new Vec3(0, 0, 0),
			"unk": true,
			"moving": false,
			"continue": false,
			"target": 0n,
			"unk2": false
		});
	}
};
