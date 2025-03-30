import {WatchTower} from "@benev/slate/x/watch/tower.js"
import {SignalTower} from "@benev/slate/x/signals/tower.js"
import {ZipAction} from "@benev/slate/x/watch/zip/action.js"

import {State} from "../../../types.js"
import {Timeline} from "../controller.js"
import {historical_state, non_historical_state} from "../../../state.js"
import {historical_actions, non_historical_actions} from "../../../actions.js"
import { Compositor } from "../../compositor/controller.js"
import { Media } from "../../media/controller.js"

let actions = {...non_historical_actions, ...historical_actions}
let state = {...historical_state, ...non_historical_state}

export function setup() {
	let signals = new SignalTower()
	let watch = new WatchTower(signals)
	let timelineTree = watch.stateTree<State>(state)
	let actions_timeline = ZipAction.actualize(timelineTree, actions)
	let media = new Media()
	return {
		timelineTree,
		timelineController: new Timeline(actions_timeline, media, new Compositor(actions_timeline))
	}
}
