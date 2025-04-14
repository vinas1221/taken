import {html} from "@benev/slate"

import {light_view} from "../../../../context/context.js"

export let AddTrackIndicator = light_view(use => (index: number) => {
	let drag = use.context.controllers.timeline.effectDragHandler
	let [indicator, setIndicator] = use.state(false)

	let drag_events = {
		drop(e: DragEvent) {
			setIndicator(false)
		},
		end(e: DragEvent) {
			setIndicator(false)
		},
		enter: () => {
			if(drag.grabbed) {
				setIndicator(true)
			}
		},
		leave: () => setIndicator(false)
	}

	return html`
		<div
			?data-indicate=${indicator ? true : false}
			class="indicator"
		>
		</div>
		<div
			@pointerenter=${drag_events.enter}
			@pointerleave=${drag_events.leave}
			@pointerup=${drag_events.drop}
			@pointercancel=${drag_events.end}
			?data-indicate=${indicator ? true : false}
			data-indicator="add-track"
			data-index=${index}
			class="indicator-area"
		>
		</div>
	`
})
