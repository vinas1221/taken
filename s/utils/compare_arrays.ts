import {AnyEffect} from "../context/types.js"

export function compare_arrays(originalArray: AnyEffect[], newArray: AnyEffect[]) {
	let add = []
	let remove = []

	for (let item of newArray) {
		if (!originalArray.find(({id}) => id === item.id)) {
			add.push(item)
		}
	}
	for (let item of originalArray) {
		if (!newArray.find(({id}) => id === item.id)) {
			remove.push(item)
		}
	}

	return {add, remove}
}
