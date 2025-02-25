import {Suite} from "cynic"
import {expect} from "chai"
import {setup} from "./setups/setup.js"

export default <Suite> {
	"timeline": {
		"calculate proposed effect placement": {
			"should be dropped after hovered effect if there is space": async() => {
				// let {timelineController, timelineTree} = setup()
				// let grabbed_effect = timelineTree.state.effects[0]
				// let hovered_effect = timelineTree.state.effects[3]
				// let hover_at = hovered_effect.start_at_position + 10
				// let proposed = timelineController.calculate_proposed_timecode({
				// 	timeline_start: hover_at,
				// 	timeline_end: hover_at + grabbed_effect.duration,
				// 	track: hovered_effect.track
				// }, grabbed_effect.id, timelineTree.state)
				// expect(proposed.proposed_place.start_at_position).to.equal(hovered_effect.start_at_position + hovered_effect.duration)
			},
			"should be shrinked if there is not enough space after hovered effect": async() => {
				// let {timelineController, timelineTree} = setup()
				// let grabbed_effect = timelineTree.state.effects[1]
				// let hovered_effect = timelineTree.state.effects[4]
				// let effect_after_hovered_effect = timelineTree.state.effects[5]
				// let space = effect_after_hovered_effect.start_at_position - (hovered_effect.start_at_position + hovered_effect.duration)
				// let hover_at = hovered_effect.start_at_position + 10
				// let proposed = timelineController.calculate_proposed_timecode({
				// 	timeline_start: hover_at,
				// 	timeline_end: hover_at + grabbed_effect.duration,
				// 	track: hovered_effect.track
				// }, grabbed_effect.id, timelineTree.state)
				// expect(proposed.duration).to.equal(space)
			}
		}
	}
}

