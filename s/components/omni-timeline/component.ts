import {repeat} from "lit/directives/repeat.js"
import {GoldElement, Op, html} from "@benev/slate"

import {styles} from "./styles.js"
import {Track} from "./views/track/view.js"
import {Toolbar} from "./views/toolbar/view.js"
import {Playhead} from "./views/playhead/view.js"
import {TimeRuler} from "./views/time-ruler/view.js"
import {TrackSidebar} from "./views/sidebar/view.js"
import {shadow_component} from "../../context/context.js"
import {TextEffect} from "./views/effects/text-effect.js"
import {VideoEffect} from "./views/effects/video-effect.js"
import {AudioEffect} from "./views/effects/audio-effect.js"
import {ImageEffect} from "./views/effects/image-effect.js"
import folderSvg from "../../icons/gravity-ui/folder.svg.js"
import {StateHandler} from "../../views/state-handler/view.js"
import {TransitionIndicator} from "./views/indicators/add-transition.js"
import {ProposalIndicator} from "./views/indicators/proposal-indicator.js"
import {calculate_timeline_width} from "./utils/calculate_timeline_width.js"

export let OmniTimeline = shadow_component(use => {
	use.styles(styles)
	use.watch(() => use.context.state)
	let state = use.context.state
	let effectTrim = use.context.controllers.timeline.effectTrimHandler
	let effectDrag = use.context.controllers.timeline.effectDragHandler
	let playheadDrag = use.context.controllers.timeline.playheadDragHandler

	use.mount(() => {
		let layout = document.querySelector("construct-editor")?.shadowRoot?.querySelector(".layout") as HTMLElement
		if(layout) {layout.style.borderRadius = "10px"}
		window.addEventListener("pointermove", augmented_dragover)
		return () => removeEventListener("pointermove", augmented_dragover)
	})

	let playheadDragOver = (event: PointerEvent) => {
		let timeline = use.shadow.querySelector(".timeline-relative")
		let bounds = timeline?.getBoundingClientRect()
		if(bounds) {
			let x = event.clientX - bounds?.left
			if(x >= 0) {
				playheadDrag.move(x)
			} else playheadDrag.move(0)
		}
	}

	let effect_drag_over = (event: PointerEvent) => {
		let timeline = use.shadow.querySelector(".timeline-relative")
		let bounds = timeline?.getBoundingClientRect()
		let path = event.composedPath()
		let indicator = path.find(e => (e as HTMLElement).className === "indicator-area") as HTMLElement | undefined
		if(bounds) {
			let x = event.clientX - bounds.left
			let y = event.clientY - bounds.top
			effectDrag.move({
				coordinates: [x >= 0 ? x : 0, y >= 0 ? y : 0],
				indicator: indicator
					? {type: "addTrack", index: Number(indicator.getAttribute("data-index"))}
					: null
			})
		}
	}

	function augmented_dragover(event: PointerEvent) {
		if(effectTrim.grabbed) {
			effectTrim.effect_dragover(event.clientX, use.context.state)
			return
		}
		playheadDragOver(event)
		effect_drag_over(event)
	}

	let render_tracks = () => repeat(use.context.state.tracks, ((_track, i) => Track([i], {attrs: {part: "add-track-indicator"}})))
	let render_effects = () => repeat(use.context.state.effects, (effect) => effect.id, (effect) => {
		if(effect.kind === "audio") {
			return AudioEffect([effect, use.element])
		}
		else if (effect.kind === "video") {
			return VideoEffect([effect, use.element])
		}
		else if (effect.kind === "text") {
			return TextEffect([effect, use.element])
		}
		else if(effect.kind === "image") {
			return ImageEffect([effect, use.element])
		}
	})

	let noEffects = use.context.state.effects.length === 0

	let renderTimelineInfo = () => {
		return noEffects ? html`
			<div class=timeline-info>
				<h3>Your timeline is empty</h3>
				<p>Add some media from ${folderSvg} panel to start editing!</p>
			</div>
		` : null
	}

	let timeline = use.defer(() => use.shadow.querySelector(".timeline-relative")) as GoldElement ?? use.element

	return StateHandler(Op.all(
		use.context.helpers.ffmpeg.is_loading.value,
		use.context.helpers.ffmpeg.is_loading.value), () => html`
		${Toolbar([timeline])}
		<div
			class="timeline"
			style="width: ${calculate_timeline_width(state.effects, state.zoom, use.element)}px;"
		>
			<div class=flex>
				<button class="add-track" @click=${() => use.context.actions.add_track()}>add track</button>
				${TimeRuler([timeline])}
			</div>
			<div class="flex">
				<div class="track-sidebars">
					${use.context.state.tracks.map((t, i) => html`${TrackSidebar([i, t.id])}`)}
				</div>
				<div class=timeline-relative>
					${renderTimelineInfo()}
					${Playhead([use.element])}
					${!noEffects ? render_tracks() : null}
					${render_effects()}
					${ProposalIndicator()}
					${TransitionIndicator()}
				</div>
			</div>
		</div>
 `)
})
