export let Keys: <T = Record<string, any>>(obj: T) => (keyof T)[] = obj => {
	//@ts-ignore
	return Object.keys(obj) as any
};

export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, fields: K[]): Omit<T, K> {
	let clone = { ...obj }

	if (Array.isArray(fields)) {
		fields.forEach(key => {
			delete clone[key]
		})
	}

	return clone
}
