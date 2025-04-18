import {Op, html, css} from "@benev/slate"

import {styles} from "./styles.js"
import {Tooltip} from "../../views/tooltip/view.js"
import {shadow_component} from "../../context/context.js"
import {tooltipStyles} from "../../views/tooltip/styles.js"
import {StateHandler} from "../../views/state-handler/view.js"
import {ImageEffect, VideoEffect} from "../../context/types.js"
import circleInfoSvg from "../../icons/gravity-ui/circle-info.svg.js"
import animationSvg from "../../icons/material-design-icons/animation.svg.js"
import {AnimationFor, animationIn, animationNone, animationOut} from "../../context/controllers/compositor/parts/animation-manager.js"

export let OmniAnim = shadow_component(use => {
	use.styles([styles, tooltipStyles, css`
		#icon-container {
			position: relative;
			top: -25px;
		}
	`])

	use.watch(() => use.context.state)
	let controllers = use.context.controllers
	let [kind, setKind] = use.state<"in" | "out">("in")
	let manager = use.context.controllers.compositor.managers.animationManager

	let selectedImageOrVideoEffect = use.context.state.selected_effect?.kind === "video" || use.context.state.selected_effect?.kind === "image"
		? use.context.state.effects.find(effect => effect.id === use.context.state.selected_effect!.id)! as ImageEffect | VideoEffect
		: null

	use.mount(() => {
		let dispose = manager.onChange(() => use.rerender())
		return () => dispose()
	})

	let getAnimationDuration = () => {
		if(selectedImageOrVideoEffect) {
			let effect = use.context.state.animations.find(a => a.targetEffect.id === selectedImageOrVideoEffect.id && a.type === kind && a.for === "Animation")
			let duration = effect?.duration
			if(duration) {
				return duration
			} else return 520
		} else return 520
	}

	let imageAndVideoEffects = () => use.context.state.effects.filter(effect => effect.kind === "image" || effect.kind === "video") as VideoEffect[] | ImageEffect[]
	let duration = getAnimationDuration()

	let renderAnimationsIn = () => {
		return animationIn.map(animation => {
			let [name, type] = animation.split("-")
			let anim = {
				type: "in" as "in" | "out",
				name: animation,
				targetEffect: selectedImageOrVideoEffect!,
				duration,
				for: "Animation" as AnimationFor
			}
			return html`
				<div
					?data-selected=${manager.selectedAnimationForEffect(selectedImageOrVideoEffect, anim)}
					?disabled=${!selectedImageOrVideoEffect}
					@click=${() => manager.selectAnimation(selectedImageOrVideoEffect!, anim, use.context.state)}
					class="animation"
				>
					<span class="text">
						${name} ${type}
					</span>
				</div>
		`})
	}

	let renderAnimationsOut = () => {
		return animationOut.map(animation => {
			let [name, type] = animation.split("-")
			let anim = {
				type: "out" as "in" | "out",
				name: animation,
				targetEffect: selectedImageOrVideoEffect!,
				duration,
				for: "Animation" as AnimationFor
			}
			return html`
				<div
					?data-selected=${manager.selectedAnimationForEffect(selectedImageOrVideoEffect, anim)}
					?disabled=${!selectedImageOrVideoEffect}
					@click=${() => manager.selectAnimation(selectedImageOrVideoEffect!, anim, use.context.state)}
					class="animation"
				>
					<span class="text">
						${name} ${type}
					</span>
				</div>
		`})
	}

	let renderAnimationNone = (type: "in" | "out") => {
			return html`
				<div
					?data-selected=${type === "in"
						? !manager.isAnyAnimationInSelected(selectedImageOrVideoEffect)
						: !manager.isAnyAnimationOutSelected(selectedImageOrVideoEffect)
					}
					?disabled=${!selectedImageOrVideoEffect}
					@click=${() => manager.removeAnimation(use.context.state, selectedImageOrVideoEffect!, type)}
					class="animation"
				>
					<span class="text">
						${animationNone}
					</span>
				</div>
		`}

	let renderEffectSelectionDropdown = () => {
		return html`
			<div class=flex>
				<select
					@change=${(event: Event) => {
						let target = event.target as HTMLSelectElement
						let effectId = target.value
						let effect = use.context.state.effects.find(effect => effect.id === effectId)!
						controllers.timeline.set_selected_effect(effect, use.context.state)
					}}
					id="clip"
					name="clip"
				>
					<option .selected=${!selectedImageOrVideoEffect} value=none>none</option>
					${imageAndVideoEffects().map(effect => html`<option .selected=${selectedImageOrVideoEffect?.id === effect.id} value=${effect.id}>${effect.name}</option>`)}
				</select>
				${renderDropdownInfo()}
			</div>
		`
	}

	let renderDurationSlider = () => {
		let frameDuration = 1000 / use.context.state.timebase
		let maxAnimationDuration = selectedImageOrVideoEffect ? (selectedImageOrVideoEffect.end - selectedImageOrVideoEffect.start) : 10000
		let normalizeMaxAnimationDuration = Math.round(maxAnimationDuration / frameDuration) * frameDuration

		return html`
			<div class=duration-slider>
				<label for="duration">Duration:</label>
				<input
					@change=${(e: InputEvent) => manager.updateAnimation(
						{duration: +(e.target as HTMLInputElement).value, kind, effect: selectedImageOrVideoEffect!}
					)}
					type="range"
					min="520"
					max=${normalizeMaxAnimationDuration}
					step=${frameDuration}
					.value=${duration}
					name="duration"
					id="duration"
				>
				<span>${duration / 1000}s</span>
			</div>
		`
	}

	let renderDropdownInfo = () => {
		return Tooltip(
			circleInfoSvg,
			html`<p>Select video or image either from dropdown menu here, timeline or scene</p>`
		)
	}

	return StateHandler(Op.all(
		use.context.helpers.ffmpeg.is_loading.value,
		use.context.is_webcodecs_supported.value), () => html`
		<div class="animations">
			<h2>${animationSvg} Animations</h2>
			<div class="btn-cnt">
				<button ?data-selected=${kind === "in"} @click=${() => setKind("in")}>In</button>
				<button ?data-selected=${kind === "out"} @click=${() => setKind("out")}>Out</button>
			</div>
			${renderEffectSelectionDropdown()}
			${renderDurationSlider()}
			<div class="anim-cnt" ?disabled=${!selectedImageOrVideoEffect}>
				${renderAnimationNone(kind)}
				${kind === "in"
					? renderAnimationsIn()
					: renderAnimationsOut()
				}
			</div>
		</div>
	`)
})
