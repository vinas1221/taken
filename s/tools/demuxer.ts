import {WebDemuxer} from "web-demuxer/dist/web-demuxer.js"

export async function demuxer(
	file: File,
	encoderWorker: Worker,
	onConfig: (config: VideoDecoderConfig) => void,
	onChunk: (chunk: EncodedVideoChunk) => void,
	start?: number,
	end?: number
) {
	let queue = 0
	var webdemuxer = new WebDemuxer({
		// ⚠️ you need to put the dist/wasm-files file in the npm package into a static directory like public
		// making sure that the js and wasm in wasm-files are in the same directory
		wasmLoaderPath: "https://cdn.jsdelivr.net/npm/web-demuxer@1.0.5/dist/wasm-files/ffmpeg.min.js",
	})
	await webdemuxer.load(file)
	var config = await webdemuxer.getVideoDecoderConfig()
	onConfig(config)
	/*
		* starting demuxing one second sooner because sometimes demuxer
		* starts demuxing from keyframe that is too far ahead from effect.start
		* causing rendering to be stuck because of too few frames,
		* also ending demuxing one second later just in case too
	*/
	var oneSecondOffset = 1000
	var reader = webdemuxer.readAVPacket(start ? (start - oneSecondOffset) / 1000 : undefined, end ? (end + oneSecondOffset) / 1000 : undefined).getReader()

	encoderWorker.addEventListener("message", (msg) => {
		if(msg.data.action === "dequeue") {
			queue = msg.data.size
		}
	})

	reader.read().then(async function processAVPacket({ done, value }): Promise<any> {
		if (done) {return}
		var delay = calculateDynamicDelay(queue)
		var videoChunk = webdemuxer.genEncodedVideoChunk(value)
		onChunk(videoChunk)
		await sleep(delay)
		return await reader.read().then(processAVPacket)
	})
}

	function calculateDynamicDelay(queueSize: number) {
		var queueLimit = 500
		var maxDelay = 100 // Maximum delay in milliseconds
		var minDelay = 0   // Minimum delay in milliseconds
		var delay = (queueSize / queueLimit) * maxDelay;
		return Math.min(maxDelay, Math.max(minDelay, delay));
	}

	function sleep(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

