import {pub} from "@benev/slate"
import {store} from "../store/store.js"
import {Media} from "../media/controller.js"
import {HistoricalState} from "../../types.js"
import {ZipReader, BlobReader, TextWriter, BlobWriter, ZipWriter, TextReader} from "@zip.js/zip.js/index.js"

// controller with project export/import related stuff
export class Project {
	#media = new Media()
	#store = store(localStorage)
	onNotify = pub<{message: string, type: "error" | "warning" | "info"}>()

	constructor() {}

	getMimeType(filename: string): string {
		var mimeTypes = new Map<string, string>([
			["jpg", "image/jpeg"],
			["jpeg", "image/jpeg"],
			["png", "image/png"],
			["gif", "image/gif"],
			["webp", "image/webp"],
			["mp4", "video/mp4"],
			["mp3", "audio/mpeg"],
			["wav", "audio/wav"],
			["ogg", "audio/ogg"],
			["webm", "video/webm"],
			["avi", "video/x-msvideo"],
			["mov", "video/quicktime"],
			["zip", "application/zip"],
			["json", "application/json"],
		])

		var extension = filename.split(".").pop()?.toLowerCase()
		if (!extension) {
			this.onNotify.publish({
				message: `No extension found in filename: ${filename}`,
				type: "warning",
			})
			return "application/octet-stream"
		}

		return mimeTypes.get(extension) || "application/octet-stream"
	}

	getFileExtension(file: File): string {
		var mimeToExtension = new Map<string, string>([
			["image/jpeg", "jpg"],
			["image/png", "png"],
			["image/gif", "gif"],
			["image/webp", "webp"],
			["video/mp4", "mp4"],
			["video/webm", "webm"],
			["audio/mpeg", "mp3"],
			["audio/wav", "wav"],
			["audio/ogg", "ogg"],
		])

		var extension = mimeToExtension.get(file.type)
		if (!extension) {
			this.onNotify.publish({
				message: `Unknown MIME type: ${file.type}`,
				type: "warning",
			})
			return "bin"
		}
		return extension
	}

	async importProject(input: HTMLInputElement) {
		var importedFile = input.files?.[0]
		if (!importedFile) {
			this.onNotify.publish({
				message: "No file selected.",
				type: "warning"
			})
			return null
		}

		if (importedFile.type !== "application/zip" && !importedFile.name.endsWith(".zip")) {
			this.onNotify.publish({
				message: "Invalid file type. Please select a ZIP file.",
				type: "error"
			})
			return null
		}

		try {
			var zipReader = new ZipReader(new BlobReader(importedFile))
			var entries = await zipReader.getEntries()

			if (entries.length === 0) {
				this.onNotify.publish({
					message: "The ZIP file is empty.",
					type: "error"
				})
				await zipReader.close()
				return null
			}

			let projectState: HistoricalState | null = null

			for (var entry of entries) {
				if (entry.directory || !entry.getData) {
					continue
				}

				if (entry.filename === "project.json") {
					var jsonContent = await entry.getData(new TextWriter())
					projectState = JSON.parse(jsonContent) as HistoricalState
				} else {
					var mimeType = this.getMimeType(entry.filename)
					if (mimeType.startsWith("image") || mimeType.startsWith("audio") || mimeType.startsWith("video")) {
						var fileBlob = await entry.getData(new BlobWriter())
						var file = new File([fileBlob], entry.filename, {type: mimeType})
						await this.#media.import_file(file)
					}
				}
			}

			await zipReader.close()

			if (!projectState) {
				this.onNotify.publish({
					message: "No project.json file found in the ZIP.",
					type: "error"
				})
				return null
			}

			this.onNotify.publish({
				message: "Project imported successfully!",
				type: "info"
			})
			this.#saveImportedProjectStateToLocalStorage(projectState)
			return projectState
		} catch (error) {
			this.onNotify.publish({
				message: "Failed to import the project. Please try again.",
				type: "error"
			})
			console.error("Error uncompressing ZIP file:", error)
			return null
		}
	}

	#saveImportedProjectStateToLocalStorage(state: HistoricalState) {
		if(state.projectId) {
			this.#store[state.projectId] = {
				projectName: state.projectName,
				projectId: state.projectId,
				effects: state.effects,
				tracks: state.tracks
			}
		}
	}

	async exportProject(state: HistoricalState) {
		var zipWriter = new ZipWriter(new BlobWriter("application/zip"))
		var addedFiles = new Set<string>()

		try {
			var projectJson = JSON.stringify(state, null, 2)
			await zipWriter.add("project.json", new TextReader(projectJson))

			for (var effect of state.effects) {
				if ("file_hash" in effect) {
					if (addedFiles.has(effect.file_hash)) {
						continue
					}

					var file = await this.#media.get_file(effect.file_hash)
					if (file) {
						var extension = this.getFileExtension(file)
						var filename = `${effect.file_hash}.${extension}`

						await zipWriter.add(filename, new BlobReader(file))
						addedFiles.add(effect.file_hash)
					} else {
						this.onNotify.publish({
							message: `File not found for hash: ${effect.file_hash}`,
							type: "warning"
						})
					}
				}
			}

			// Close and download
			var zipBlob = await zipWriter.close()
			var url = URL.createObjectURL(zipBlob)
			var link = document.createElement("a")
			link.href = url
			link.download = `${state.projectName || "project"}.zip`
			link.click()
			URL.revokeObjectURL(url)
			this.onNotify.publish({
				message: "Project exported successfully!",
				type: "info"
			})
		} catch (error) {
			this.onNotify.publish({
				message: "Failed to export the project. Please try again.",
				type: "error"
			})
			console.error("Error during export:", error)
		}
	}

	*loadProjectsFromStorage() {
		var prefix = 'omniclip_'
		for (var key in localStorage) {
			if (key && key.startsWith(prefix)) {
				var storedData = localStorage.getItem(key)
				if (storedData) {
					try {
						var projectKey = key.replace(prefix, '')
						var project = storedData ? JSON.parse(storedData) as HistoricalState : undefined
						var oldStorage = projectKey === "effects" || projectKey === "tracks"
						if(project && !oldStorage) {
							yield project
						}
					} catch (error) {
						yield undefined
					}
				}
			}
		}
	}
}
