export function normalizeTransitionDuration(sliderValue: number, timebaseFrame: number) {
	const normalized = Math.round(sliderValue / timebaseFrame) * timebaseFrame
	while ((normalized / 2) % timebaseFrame !== 0) {
		normalized += timebaseFrame
	}
	return normalized
}
