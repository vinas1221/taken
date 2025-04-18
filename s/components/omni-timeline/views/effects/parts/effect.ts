import {CSSResultGroup, TemplateResult, html, css, GoldElement} from "@benev/slate"

import {styles} from "./styles.js"
import {V2} from "../../../utils/coordinates_in_rect.js"
import {AnyEffect, At} from "../../../../../context/types.js"
import {collaboration, shadow_view} from "../../../../../context/context.js"
import {calculate_effect_width} from "../../../utils/calculate_effect_width.js"
import {calculate_start_position} from "../../../utils/calculate_start_position.js"
import lowQualitySvg from "../../../../../icons/material-design-icons/low-quality.svg.js"
import {calculate_effect_track_placement} from "../../../utils/calculate_effect_track_placement.js"

export let Effect = shadow_view(use => (timeline: GoldElement, any_effect: AnyEffect, content: TemplateResult, style?: CSSResultGroup, inline_css?: string) => {
	use.styles([style ?? css``, styles])
	use.watch(() => use.context.state)
	let state = use.context.state
	let effect = use.context.state.effects.find(effect => effect.id === any_effect.id) ?? any_effect
	let isVisible = state.tracks.find((_, i) => i === effect.track)?.visible
	let isLocked = state.tracks.find((_, i) => i === effect.track)?.locked
	let [[x, y], setCords] = use.state<V2 | [null, null]>([null, null])
	let zoom = use.context.state.zoom
	let controller = use.context.controllers.timeline
	let media_controller = use.context.controllers.media
	let effectDragHandler = use.context.controllers.timeline.effectDragHandler
	let handler = controller.effectTrimHandler
	let [fileNotFound, setFileNotFound] = use.state(false)
	let [timelineScrollLeft, setTimelineScrollLeft] = use.state(0)
	let [previewPosition, setPreviewPosition] = use.state<{start: null | number; startAtPosition: null | number; end: number | null}>({
		start: null,
		startAtPosition: null,
		end: null
	})

	// collaboration
	let [fileProgress, setFileProgress] = use.state(0)
	let [isFileProxy, setIsProxy] = use.state(false)

	use.mount(() => handler.onDrop(({effectId}) => {
		if(effectId === effect.id) {
			setPreviewPosition({
				startAtPosition: null,
				start: null,
				end: null
			})
		}
	}))

	use.mount(() => effectDragHandler.onDrop(({grabbed}) => {
		if(grabbed?.effect?.id === effect?.id) {
			setPreviewPosition({
				startAtPosition: null,
				start: null,
				end: null
			})
			setCords([null, null])
		}
	}))

	use.mount(() => {
		let dispose1 = collaboration.onFileProgress(({hash, progress}) => {
			if(any_effect.kind !== "text") {
				if(hash === any_effect.file_hash) {
					setFileProgress(progress)
				}
			}
		})
		let dispose = media_controller.on_media_change(({files, action}) => {
			if(action === "added") {
				for(let media of files) {
					if(any_effect.kind !== "text" && media.hash === any_effect.file_hash) {
						setFileNotFound(false)
						if(media.kind === "video") {
							setIsProxy(media.proxy)
						}
					}
				}
			}
		})
		let set_scroll = () => setTimelineScrollLeft(timeline.scrollLeft)
		timeline.addEventListener("scroll", set_scroll)
		return () => {removeEventListener("scroll", set_scroll); dispose(); dispose1()}
	})

	use.once(async () => {
		if(any_effect.kind !== "text") {
			let file = await media_controller.get_file(any_effect.file_hash)
			if(!file) {setFileNotFound(true)}
		}
	})

	let drag_events = {
		effect_drag_listener() {
			let dispose = effectDragHandler.onEffectDrag((e) => {
				let isDragged = e.grabbed.effect.id === effect.id
				if(isDragged) {
					let center_of_effect: V2 = [
						e.position.coordinates[0] - e.grabbed.offset.x,
						e.position.coordinates[1] - e.grabbed.offset.y
					]
					setCords(center_of_effect)
				}
			})
			return () => dispose()
		},
		start(event: PointerEvent) {
			use.context.controllers.timeline.set_selected_effect(effect, use.context.state)
			let timelineElement = timeline.shadowRoot?.querySelector(".timeline-relative")
			let bounds = timelineElement?.getBoundingClientRect()
			if(bounds && !handler.grabbed) {
				let x = event.clientX - bounds.left
				let y = event.clientY - bounds.top
				let at = {coordinates: [x >= 0 ? x : 0, y >= 0 ? y : 0], indicator: null} satisfies At
				effectDragHandler.start({effect, offset: {x: event.offsetX, y: event.offsetY}}, at)
			}
		},
		drop(e: PointerEvent) {
			effectDragHandler.drop(e)
		},
		end() {
			effectDragHandler.end()
		}
	}

	use.mount(() => {
		let dispose = drag_events.effect_drag_listener()
		let dispose1 = handler.onDragOver(({start_at_position, effectId, start, end}) => {
			if(effectId === effect.id) {
				setPreviewPosition({
					start,
					startAtPosition: start_at_position,
					end
				})
			}
		})
		let dropevents = (e: PointerEvent) => {
			drag_events.drop(e)
			handler.trim_drop(e, use.context.state)
		}
		let endevents = (e: PointerEvent) => {
			drag_events.end()
			handler.trim_end(e, use.context.state)
		}
		window.addEventListener("pointercancel", endevents)
		window.addEventListener("pointerup", dropevents)
		return () => {removeEventListener("pointerup", dropevents); removeEventListener("pointercancel", endevents); dispose(); dispose1()}
	})

	let render_trim_handle = (side: "left" | "right") => {
		return html`
			<span
				@pointerup=${(e: PointerEvent) => handler.trim_drop(e, use.context.state)}
				@pointercancel=${(e: PointerEvent) => handler.trim_end(e, use.context.state)}
				@pointerdown=${(e: PointerEvent) => handler.trim_start(e, effect, side)}
				class="trim-handle-${side}"
			>
				<span class=line></span>
				<span class=line></span>
			</span>
			`
	}

	let grabbed = effectDragHandler.grabbed?.effect === effect

	let renderPreview = () => {
		return html`
			<div
				?data-grabbed=${grabbed}
				?data-selected=${use.context.state.selected_effect?.id === effect.id}
				style="
					${inline_css}
					background-image: none;
					width: ${((previewPosition.end ?? effect.end) - (previewPosition.start ?? effect.start)) * Math.pow(2, zoom)}px;
					transform: translate(
						${x ?? calculate_start_position(previewPosition.startAtPosition ?? effect.start_at_position, use.context.state.zoom)}px,
						${y ?? calculate_effect_track_placement(effect.track, use.context.state.effects)}px
					);
				"
				@pointerdown=${drag_events.start}
				class="trim-handles"
			>
				${render_trim_handle("left")}
				${render_trim_handle("right")}
			</div>
		`
	}

	let effectLeft = timelineScrollLeft - (x ?? calculate_start_position(effect.start_at_position, zoom))

	return html`
		${renderPreview()}
		<span
			class="effect"
			?data-locked=${isLocked}
			?data-hidden=${!isVisible}
			?data-no-file=${fileNotFound}
			?data-grabbed=${grabbed}
			?data-selected=${use.context.state.selected_effect?.id === effect.id}
			style="
				${inline_css}
				width: ${calculate_effect_width(effect, zoom)}px;
				transform: translate(
					${x ?? calculate_start_position(effect.start_at_position, zoom)}px,
					${y ?? calculate_effect_track_placement(effect.track, use.context.state.effects)}px
				);
			"
			@pointerdown=${drag_events.start}
		>
			${fileNotFound
				? html`
					<span
						class="not-found"
						style="
							width: 100%;
							transform: translateX(${effectLeft < 0 ? 0 : effectLeft}px);
						"
					>
						${fileProgress
							? html`
									<div class="progress-float">Progress: ${fileProgress.toFixed(0)}%</div>
									<div style="height: ${fileProgress.toFixed(0)}%;" class="progress"></div>
								`
							: html`<span class=no-file>File Not Found: ${effect.kind !== "text" ? effect.name : null}</span>`
						}
					</span>`
				: isFileProxy
					? html`
						<span
							class="proxy"
							style="transform: translateX(${effectLeft < 0 ? 0 : effectLeft}px);"
						>
							${lowQualitySvg}
						</span>`
					: null
			}
			<span class="content" style="transform: translateX(${-effect.start * Math.pow(2, use.context.state.zoom)}px)">${content}</span>
		</span>
	`
})
