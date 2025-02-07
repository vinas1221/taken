import {V2} from "./coordinates_in_rect.js"
import {AnyEffect} from "../../../context/types.js"
import {calculate_effect_width} from "./calculate_effect_width.js"

export function calculate_closest_track_place(
	effect: AnyEffect,
	cords: V2,
	track_height: number,
	zoom: number
): V2 {

	let [x, y] = cords

	let track_index = Math.floor(y / 50)
	let track_start = track_index * track_height

	let width = calculate_effect_width(effect, zoom)
	let position = {
		y: track_start,
		x: x - width / 2
	}
	return [position.x, position.y]
}

	//let track_end = (track_index + 1) * track_height
	//let margin = 5
	//let start_at = y >= track_start + margin
	//let end_at = y <= track_end - margin

