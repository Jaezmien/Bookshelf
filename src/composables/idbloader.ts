import { useFileStore } from '@/stores/files'
import { onMounted } from 'vue'

export const IDBLoaderComposition = () => {
	onMounted(async () => {
		try {
			return await IDBLoaderAsync()
		} catch (err) {
			throw err
		}
	})
}
export const IDBLoaderAsync = async () => {
	try {
		const fileStore = useFileStore()

		if (!fileStore.idb_loaded) {
			await fileStore.open_database()
			return true
		}
		return false
	} catch (err) {
		throw err
	}
}
