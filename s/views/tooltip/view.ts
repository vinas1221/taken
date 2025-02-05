import {SVGTemplateResult, TemplateResult, html} from "@benev/slate"

import {light_view} from "../../context/context.js"
import type {
	computePosition as ComputePosition,
	autoUpdate as AutoUpdate,
	hide as Hide,
	autoPlacement as AutoPlacement,
	Placement
} from "@floating-ui/dom"
import {
	computePosition as untypedComputePosition,
	autoUpdate as untypedAutoUpdate,
	hide as untypedHide,
	autoPlacement as untypedAutoPlacement,
	//@ts-ignore
} from "@floating-ui/dom/dist/floating-ui.dom.browser.mjs"

type Stuff = {
	iconContainer: HTMLElement
	tooltip: HTMLElement
	cleanup: (() => void)[]
}

let autoPlacement = untypedAutoPlacement as typeof AutoPlacement
let computePosition = untypedComputePosition as typeof ComputePosition
let autoUpdate = untypedAutoUpdate as typeof AutoUpdate
let hide = untypedHide as typeof Hide

export let Tooltip = light_view(use => (icon: SVGTemplateResult | TemplateResult, content: TemplateResult, iconContainerStyles?: string, placement?: Placement) => {
	let elements = use.signal<Stuff | null>(null)

	use.defer(() => {
		if (elements.value)
				return undefined
		let iconContainer = use.element.querySelector('#icon-container')?.firstElementChild as HTMLButtonElement
		let tooltip = use.element.querySelector('#tooltip') as HTMLElement
		let compute = () => computePosition(iconContainer, tooltip, {
				middleware: [hide()],
				strategy: "fixed",
				placement: placement ?? 'top',
		}).then(({x, y}) => {
			Object.assign(tooltip.style, {
				left: `${x}px`,
				top: `${y}px`,
			})
		})
		let interval = setInterval(() => compute(), 100)
		elements.value = {
			iconContainer,
			tooltip,
			cleanup: [
				autoUpdate(iconContainer, tooltip, () => compute()),
				() =>  clearInterval(interval)
			]
		}
	})

	use.mount(() => () => {
		if (elements.value)
			elements.value.cleanup.forEach(cleanup => cleanup())
	})

	let showTooltip = () => {
		if(elements.value) {
			elements.value.tooltip.style.opacity = "1"
		}
	}

	let hideTooltip = () => {
		if(elements.value) {
			elements.value.tooltip.style.opacity = "0"
		}
	}

	return html`
		<div
			@pointerenter=${showTooltip}
			@pointerleave=${hideTooltip}
			id="icon-container"
			styles=${iconContainerStyles}
		>
			${icon}
		</div>
		<div id="tooltip">
			${content}
		</div>
	`
})
