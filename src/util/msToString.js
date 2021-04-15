/*
 * This function is used to convert unixMS (or any ms really)
 * into a text format
 * removing any of them that's < 0 (eg. 0 hours, 15 min, 0 sec => 15 min and 0 sec)
 * Can also be extended to support days, months, etc.
 * But since reps are per 24 hours, there's no need to.
 */
module.exports = ms => {
	const s = Math.floor(ms / 1000) % 60;
	const m = Math.floor(s / 60) % 60;
	const h = Math.floor(m / 60) % 24;
	const sTxt = s > 1 ? `${s.toLocaleString('en')} seconds` : `${s.toLocaleString('en')} second`;
	const mTxt = m > 1 ? `${m.toLocaleString('en')} minutes` : `${m.toLocaleString('en')} minute`;
	const hTxt = h > 1 ? `${h.toLocaleString('en')} hours` : `${h.toLocaleString('en')} hour`;
	const periodsTXT = [hTxt, mTxt, sTxt];
	const time = [h, m, s];
	const result = [];
	for (const i of time) {
		if (i > 0) {
			for (const j of periodsTXT) {
				result.push(j);
			}
			break;
		}
	}
	return result.join(' ');
};
