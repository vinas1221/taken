import {dashify} from "./dashify.js"

export function registerElements(elements: {
		[name: string]: {new(): HTMLElement}
	}) {

	for (let [name, element] of Object.entries(elements)) {
		let dashified = dashify(name)
		if(!customElements.get(dashified))
			customElements.define(dashified, element)
	}
}
