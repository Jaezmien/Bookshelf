<script lang="ts" setup>
import Bookshelf from '@/components/Bookshelf.vue';
import StoryView from '@/components/StoryView/index.vue';
import { Bookmark, load_bookmark } from '@/libs/Bookmark';
import { IndexedDBStory, LocalStorageStory, useFileStore } from '@/stores/files';
import { BookNotification } from '@/symbols';
import { computed, inject, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const fileStore = useFileStore();
fileStore.load_stories()

const create_notification = inject(BookNotification)!;

const bookmark = ref<Bookmark | null>(null)
const story_data = ref<LocalStorageStory | null>(null)
const story_content = ref<IndexedDBStory | null>(null)

function fetch_story(uuid: string) {
	fileStore.load_file(uuid).then(([data, story]) => {
		bookmark.value = load_bookmark(data.ID)
		story_data.value = data;
		story_content.value = story;
	}).catch(err => {
		console.error(err);
		create_notification("An error has occured while trying to load a story.", 2);
		router.push("/");
	});
}

const has_loaded = computed(() => {
	return story_data.value && story_content.value
})
const story_formatteed = computed(() => {
	if (!story_data.value || !story_content.value) return null
	return fileStore.convert_local_idb_to_fimstory(story_data.value, story_content.value)
})

watch(() => route.params, () => {
	if (route.name !== "Story") return;
	fetch_story(route.params.id as string)
}, { immediate: true })
</script>

<template>
	<div v-if="has_loaded">
		<header>
			<Bookshelf :clickable="true"
					   @click="router.push('/')"></Bookshelf>
		</header>
		<StoryView :filename="story_data!.Filename"
				   :story="story_formatteed!"
				   :bookmark="bookmark!">
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