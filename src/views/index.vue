<script setup lang="ts">
import Bookshelf from '@/components/Bookshelf.vue';
import { IDBLoaderComposition as IDBLoader } from '@/composables/idbloader';
import { useFileStore } from '@/stores/files';
import { BookNotification, BookSettings, SaveBookSettings } from '@/symbols';
import { inject, reactive, ref, computed, watch, onMounted } from 'vue';
import { FiMFormatType, ParseFiMStory } from '@/libs/FiMParser';
import FeatherIcon from '@/components/FeatherIcon.vue';
import { CreateButtonLoader, CreateDropLoader, DropLoaderResult, load_file_as_text } from '@/composables/droploader';
import path from "path";

const fileStore = useFileStore()
const create_notification = inject(BookNotification, (m, t = 0) => { })
IDBLoader()

const fileInputRef = ref<HTMLInputElement>(document.createElement('input'))
const storyAddRef = ref<HTMLDivElement>(document.createElement('div'))
const loadingAmountRef = ref<number | null>(null)

async function load_story(filename: string, storyFile: File) {
	try {
		const event = await load_file_as_text(storyFile)

		const story = await ParseFiMStory(filename, (event.target!.result) as string)
		const [, isUpdate] = await fileStore.add_file(filename, story)
		create_notification(`${isUpdate ? 'Updated' : 'Added'} story ${story.Format === FiMFormatType.RAW ? filename : story.Title}.`)
	}
	catch (err) {
		console.error(err)
		on_drop_error(`An error has occured while trying to read the file ${filename}.`)
	}
	finally {
		loadingAmountRef.value! -= 1
	}
}

function on_drop(files: DropLoaderResult[]) {
	loadingAmountRef.value = files.length
	Promise.all(files.map(([f, sf]) => load_story(f, sf))).then(() => {
		loadingAmountRef.value = null
	})
}
function on_drop_error(err: any) {
	create_notification(err ?? 'An error has occured while trying to load a file.', 2)
}

function delete_story(uuid: string) {
	if (!confirm('Are you sure you want to delete this story? This action is irreversible!')) return
	fileStore.remove_file(uuid)
		.then(() => {
			create_notification('Deleted story!')
		}).catch(err => {
			console.error(err);
			on_drop_error('An error has occured while deleting the story.')
		});
}

const { isUserDragging } = CreateDropLoader(storyAddRef, on_drop, on_drop_error)
CreateButtonLoader(storyAddRef, fileInputRef, on_drop, on_drop_error)

function format_filename(str: string) {
	return path.basename(str, path.extname(str))
}

const settings = inject(BookSettings)!
const save_settings = inject(SaveBookSettings)!
const sortSelection = reactive({
	selected: settings.Sort || 'Last Accessed',
	options: ['Title', 'Author', 'Date Added', 'Last Accessed']
})
watch(() => sortSelection.selected, () => {
	settings.Sort = sortSelection.selected
	save_settings()
})
const sortedSelection = computed(() => {
	if (sortSelection.selected === "Title") {
		return fileStore.stories.sort((a, b) => {
			const nameA: string = a.Format === FiMFormatType.RAW ? a.Filename : a.Title
			const nameB: string = b.Format === FiMFormatType.RAW ? b.Filename : b.Title
			return nameA.localeCompare(nameB)
		})
	}
	if (sortSelection.selected === "Author") {
		return fileStore.stories.sort((a, b) => {
			const authorA: string = a.Format === FiMFormatType.RAW ? '' : a.Author
			const authorB: string = b.Format === FiMFormatType.RAW ? '' : b.Author
			return authorA.localeCompare(authorB)
		})
	}
	if (sortSelection.selected === "Date Added") {
		return fileStore.stories.sort((a, b) => {
			return b.Timestamp - a.Timestamp
		})
	}
	if (sortSelection.selected === "Last Accessed") {
		return fileStore.stories.sort((a, b) => {
			return b.LastAccessed - a.LastAccessed
		})
	}
	return fileStore.stories
})
</script>

<template>
	<div id="index-container">
		<Bookshelf></Bookshelf>

		<section id="story-add-container">
			<div id="story-add"
				 ref="storyAddRef"
				 :class="{ dragging: isUserDragging }">
				<template v-if="!loadingAmountRef">
					<FeatherIcon :icon="'download'"
								 :size="'2rem'"></FeatherIcon>
					<p><b>Upload a file</b>, or drag it here.</p>
				</template>
				<template v-else>
					<FeatherIcon :icon="'refresh-cw'"
								 :size="'2rem'"
								 class="spinner"></FeatherIcon>
					<p>Uploading {{ loadingAmountRef }} stories...</p>
				</template>
			</div>
			<input type="file"
				   ref="fileInputRef" />
		</section>

		<section id="story-list-options">
			<div>
				<label for="sortBy">Sort by </label>
				<select name="sortBy"
						v-model="sortSelection.selected"
						id="sortBy">
					<option v-for="option of sortSelection.options"
							:value="option">{{ option }}</option>
				</select>
			</div>
		</section>

		<section id="story-list-container">
			<router-link v-for="story of sortedSelection"
						 :to="'/story/' + story.StoryUUID"
						 custom
						 v-slot="{ navigate }">
				<div class="story"
					 @click="navigate">
					<span class="story-delete"
						  @click.stop="delete_story(story.StoryUUID)">
						<FeatherIcon :icon="'x'"></FeatherIcon>
					</span>
					<template v-if="story.Format === FiMFormatType.RAW">
						<h3 class="story-title">{{ format_filename(story.Filename) }}</h3>
					</template>
					<template v-else>
						<h3 class="story-title">{{ story.Title }}</h3>
						<p class="story-author">{{ story.Author }}</p>
					</template>
				</div>
			</router-link>
			<p id="story-container-empty"
			   v-if="!fileStore.stories.length">
				It seems kind of empty in here...
			</p>
		</section>
	</div>
</template>

<style lang="scss" scoped>
$BACKGROUND: #1f2229;

#index-container {
	height: 100vh;
	overflow-x: hidden;
	display: grid;

	grid-template-areas:
		'logo'
		'insert'
		'options'
		'list';
	grid-template-rows: 1fr 1fr 0.1fr 4fr;

	gap: 0.5rem;
	padding: 1rem;

	#bookshelf-logo {
		grid-area: logo;
	}
}

#story-add-container {
	grid-area: insert;

	display: grid;
	place-items: center;

	#story-add {
		height: 6rem;
		width: 100%;
		display: block;
		border-radius: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		border: dashed 2px transparentize(white, 0.8);
		transition: border 200ms ease;

		&.dragging {
			border: dashed 2px white;
		}

		cursor: pointer;

		p {
			margin: 0 1rem;
			text-align: center;
		}

		// Animation
		.spinner {
			animation-name: spin;
			animation-timing-function: ease-in-out;
			animation-iteration-count: infinite;
			animation-duration: 2000ms;
		}

		@keyframes spin {
			0% {
				transform: rotate(0deg);
			}

			100% {
				transform: rotate(720deg);
			}
		}
	}
}

#story-list-options {
	grid-area: options;

	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
}

#story-list-container {
	grid-area: list;
	overflow-y: auto;
	overflow-x: hidden;
	max-height: 100%;

	#story-container-empty {
		text-align: center;
		opacity: 50%;
	}

	background-color: lighten($BACKGROUND, 10%);
	border-radius: 0.5rem;

	.os-host {
		max-height: inherit;
	}

	.story {
		padding: 1rem 2rem;
		background-color: transparent;
		transition: background 200ms ease;
		// border-radius: 0.5rem;

		cursor: pointer;

		&:hover {
			background-color: transparentize(black, 0.9);
		}

		.story-title {
			margin: 0;
		}

		.story-author {
			margin: 0;
		}

		.story-delete {
			float: right;
			cursor: pointer;
			color: lighten(red, 20%);
			margin-left: 1rem;
			transition: color 200ms ease;

			&:hover {
				color: lighten(red, 0%);
			}
		}
	}

}

input[type=file] {
	display: none;
}
</style>