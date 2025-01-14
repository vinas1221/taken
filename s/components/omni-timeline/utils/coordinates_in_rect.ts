export type V2 = [number, number]

export function coordinates_in_rect(
	coordinates: V2,
	rect: DOMRect,
): V2 | null {

	let [clientX, clientY] = coordinates
	let x = clientX - rect.left
	let y = clientY - rect.top

	let withinX = (x >= 0) && (x <= rect.width)
	let withinY = (y >= 0) && (y <= rect.height)
	let within = withinX && withinY

	return within
		? [x, y]
		: null
}
