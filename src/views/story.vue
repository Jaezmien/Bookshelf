<script lang="ts">
import { useFileStore, LSData, IDBStory } from '@/stores/files'
import { BookNotification } from '@/symbols'
import { defineComponent, inject } from 'vue'
import { IDBLoaderAsync } from '@/composables/idbloader';
import { FiMFormatType, FiMStoryFull, FiMStoryRaw, FiMStoryType } from '@/libs/FiMParser';
import StoryView from '@/components/StoryView/index.vue';
import Bookshelf from '@/components/Bookshelf.vue';
import { Bookmark, load_bookmark } from '@/libs/Bookmark';

interface IData {
	storyData: LSData | null,
	storyContent: IDBStory | null,
	storyBookmark: Bookmark | null
}

export default defineComponent({
	setup() {
		const fileStore = useFileStore();
		const create_notification = inject(BookNotification)!;
		return {
			fileStore,
			create_notification,
		};
	},
	data() {
		return {
			storyData: null,
			storyContent: null,
			storyBookmark: null,
		} as IData;
	},
	computed: {
		storyLoaded() {
			return this.storyData && this.storyContent
		},
		dataStory(): (FiMStoryType | null) {
			if (!this.storyLoaded) return null;

			const data = this.storyData! // thank you typescript <3
			if (data.Format === FiMFormatType.RAW) {
				return <FiMStoryRaw>{
					Format: FiMFormatType.RAW,
					Text: this.storyContent!.Content
				};
			}
			else {
				return <FiMStoryFull>{
					Format: data.Format,
					Title: data.Title,
					Author: data.Author,
					Chapters: this.storyContent!.Content
				};
			}
		}
	},
	methods: {
		fetchStory(uuid: string) {
			this.fileStore.load_file(uuid).then(([data, story]) => {
				this.storyBookmark = load_bookmark(data.StoryUUID)
				this.storyData = data;
				this.storyContent = story;
			}).catch(err => {
				console.error(err);
				this.create_notification("An error has occured while trying to load a story.", 2);
				this.$router.push("/");
			});
		}
	},
	async created() {
		await IDBLoaderAsync();
		this.$watch(() => this.$route.params, () => {
			if (this.$route.name !== "Story") return
			this.fetchStory(this.$route.params.uuid as string);
		}, { immediate: true });
	},
	components: { StoryView, Bookshelf }
})
</script>

<template>
	<div v-if="storyLoaded">
		<header>
			<Bookshelf :clickable="true"
					   @click="$router.push('/')"></Bookshelf>
		</header>
		<StoryView :filename="storyData!.Filename"
				   :story="dataStory!"
				   :bookmark="storyBookmark!">
		</StoryView>
	</div>
	<div id="story-loading"
		 v-else>
		<p>Fetching story...</p>
	</div>
</template>

<style lang="scss" scoped>
header {
	padding: 1rem 0;
	background: transparentize(black, 0.8);
	border-bottom-left-radius: 1rem;
	border-bottom-right-radius: 1rem;
}

#story-loading {
	min-height: 100vh;
	display: grid;
	place-items: center;
}
</style>