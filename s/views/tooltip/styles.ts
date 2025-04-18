import {css} from "@benev/slate"

export let tooltipStyles = css`
	#tooltip {
		display: flex;
		position: fixed;
		width: max-content;
		top: 0;
		left: 0;
		background: #0a0a0a;
		color: gray;
		z-index: 105;
		pointer-events: none;
		max-width: 200px;
		border-radius: 5px;
		padding: 0.2em 0.3em;
		font-size: 12px;
		opacity: 0;
		transition: opacity 0.3s ease-in-out;
	}

	#floating {
		position: absolute;
		width: max-content;
		top: 0;
		left: 0;
	}

	#arrow {
		position: absolute;
	}

	#icon-container {
		display: flex;
		position: relative;
		z-index: 100;

		& > :first-child {
			display: flex;
		}

		& svg {
			pointer-events: none;
		}
	}

	i {
		position:absolute;
		top:100%;
		left:50%;
		margin-left:-12px;
		width:24px;
		height:12px;
		overflow:hidden;
	}

	i::after {
		content:'';
		position:absolute;
		width:12px;
		height:12px;
		left:50%;
		transform:translate(-50%,-50%) rotate(45deg);
		background-color:#EEEEEE;
		box-shadow:0 1px 8px rgba(0,0,0,0.5);
	}
`
