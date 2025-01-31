import {Connection} from "sparrow-rtc"
import {FileHandler} from "./file-handler"
import type {file as File, dir as Dir, write as Write} from "opfs-tools"
//@ts-ignore
import * as opfs from 'https://cdn.jsdelivr.net/npm/opfs-tools@0.7.0/+esm'
let file = opfs.file as typeof File
let dir = opfs.dir as typeof Dir
let write = opfs.write as typeof Write

export {file, dir, write}

interface ChunkMetadata {
	offset: number
	length: number
}

export class OPFSManager {
	#worker = new Worker(new URL('./opfs-worker.js', import.meta.url), {type: "module"})

	constructor(private fileHandler: FileHandler) {
		this.#init()
	}

	async #init(): Promise<void> {
		// clear
		await dir('/compressed').remove()
		await dir('/compressed').create()
	}

	async createMetadataFile(videoFileName: string): Promise<void> {
		let metadataFileName = `${videoFileName}.metadata.json`
		await write(`/${metadataFileName}`, '[]')
	}

	async writeChunk(
		fileHash: string,
		chunk: Uint8Array
	): Promise<void> {
		this.#worker.postMessage({
			filePath: `/compressed/${fileHash}`,
			metadataPath: `/compressed/${fileHash}.metadata.json`,
			chunk,
			action: 'writeChunk'
		})
	}

	async readChunk(
		fileName: string,
		metadataFileName: string,
		chunkIndex: number
	): Promise<Uint8Array> {
		let metadata = await this.#readMetadata(metadataFileName)
		let {offset, length} = metadata[chunkIndex]
		let fileHandle = file(`/${fileName}`)
		let reader = await fileHandle.createReader()
		let arrayBuffer = await reader.read(length, {at: offset})
		await reader.close()
		return new Uint8Array(arrayBuffer)
	}

	async #readMetadata(metadataFileName: string): Promise<ChunkMetadata[]> {
		let metadataFile = file(`/${metadataFileName}`)
		let metadataText = await metadataFile.text()
		return JSON.parse(metadataText)
	}

	sendFile(originalFile: File, fileHash: string, frames: number, peer: Connection) {
		this.fileHandler.sendFileMetadata(peer.cable.reliable, fileHash, originalFile, true, frames)

		this.#worker.postMessage({
			filePath: `/compressed/${fileHash}`,
			metadataPath: `/compressed/${fileHash}.metadata.json`,
			action: 'getFile',
			frames,
			hash: fileHash
		})

		this.#worker.addEventListener("message", (e) => {
			if(e.data.action === "fileChunk") {
				let chunk = e.data.chunk as Uint8Array
				if(e.data.hash === fileHash)
					this.fileHandler.sendChunk(chunk, e.data.hash, peer.cable.reliable)
			}
			if(e.data.action === "finished") {
				if(e.data.hash === fileHash) {
					peer.cable.reliable.send(JSON.stringify({done: true, hash: fileHash, filename: originalFile.name, fileType: originalFile.type, proxy: true}))
					this.fileHandler.markFileAsSynced(fileHash)
				}
			}
		})
	}

	async writeMetadata(
		metadataFileName: string,
		metadata: ChunkMetadata[]
	): Promise<void> {
		let metadataFile = file(`/${metadataFileName}`)
		await write(metadataFile.path, JSON.stringify(metadata))
	}
}
