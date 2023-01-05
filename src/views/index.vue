<script setup lang="ts">
import Bookshelf from '@/components/Bookshelf.vue';
import SortSetting from "@/components/SortSetting.vue";
import { CreateButtonLoader, CreateDropLoader, DropLoaderResult, load_file_as_text } from '@/composables/droploader';
import { load_bookmark } from '@/libs/Bookmark';
import { useFileStore } from '@/stores/files';
import { useSettingStore } from '@/stores/settings';
import { BookNotification } from '@/symbols';
import FadeTransition from '@/transitions/FadeTransition.vue';
import ParseFIMStory from "fimfic-parser";
import { RefreshCw, SortDesc, Upload, X } from "lucide-vue-next";
import path from "path";
import { computed, inject, ref } from 'vue';

const create_notification = inject(BookNotification, (m, t = 0) => { })

const settings = useSettingStore()
const fileStore = useFileStore()
fileStore.load_stories()

const show_sort_setting = ref(false)

const bookmarkStatus = computed(() => {
	if (!fileStore.stories) return null

	return fileStore.stories.map(story => story.ID).reduce<Record<string, number>>((tbl, uuid) => {
		tbl[uuid] = load_bookmark(uuid).progress ?? 0
		return tbl
	}, {})
})

const fileInputRef = ref<HTMLInputElement>(document.createElement('input'))
const uploadRef = ref<HTMLDivElement>(document.createElement('div'))
const loadingAmount = ref<number>(0)

async function load_story(filename: string, storyFile: File) {
	try {
		const event = await load_file_as_text(storyFile)

		const story = await ParseFIMStory((event.target!.result) as string)
		const [, isUpdate] = await fileStore.add_file(filename, story)
		create_notification(`${isUpdate ? 'Updated' : 'Added'} story ${story.Format === 'NONE' ? filename : story.Title}.`)
	}
	catch (err) {
		console.error(err)
		on_drop_error(`An error has occured while trying to read the file ${filename}.`)
	}
	finally {
		loadingAmount.value! -= 1
	}
}

function on_drop(files: DropLoaderResult[]) {
	loadingAmount.value = files.length
	Promise.all(files.map(([f, sf]) => load_story(f, sf))).then(() => {
		loadingAmount.value = 0
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

const { isUserDragging } = CreateDropLoader(uploadRef, on_drop, on_drop_error)
CreateButtonLoader(uploadRef, fileInputRef, on_drop, on_drop_error)

function format_filename(str: string) {
	return path.basename(str, path.extname(str))
}

const sortedSelection = computed(() => {
	if (settings.Sort === "Title") {
		return fileStore.stories.sort((a, b) => {
			const nameA: string = a.Format === 'NONE' ? a.Filename : a.Title
			const nameB: string = b.Format === 'NONE' ? b.Filename : b.Title
			return nameA.localeCompare(nameB)
		})
	}
	if (settings.Sort === "Author") {
		return fileStore.stories.sort((a, b) => {
			const authorA: string = a.Format === 'NONE' ? '' : a.Author
			const authorB: string = b.Format === 'NONE' ? '' : b.Author
			return authorA.localeCompare(authorB)
		})
	}
	if (settings.Sort === "Date Added") {
		return fileStore.stories.sort((a, b) => {
			return b.Created - a.Created
		})
	}
	if (settings.Sort === "Last Accessed") {
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

		<section id="story-bookshelf">
			<section id="story-bookshelf-stories">
				<router-link v-for="story of sortedSelection"
							 :to="'/story/' + story.ID"
							 custom
							 v-slot="{ navigate }">
					<div class="story"
						 :style="{ '--completion': (bookmarkStatus ? bookmarkStatus[story.ID] : 0) + '%' }"
						 @click="navigate">
						<span class="story-delete"
							  @click.stop="delete_story(story.ID)">
							<X></X>
						</span>
						<template v-if="story.Format === 'NONE'">
							<h3 class="story-title">{{ format_filename(story.Filename) }}</h3>
						</template>
						<template v-else>
							<h3 class="story-title">{{ story.Title }}</h3>
							<p class="story-author">{{ story.Author }}</p>
						</template>
					</div>
				</router-link>
				<p id="story-bookshelf-empty"
				   v-if="!fileStore.stories.length">
					It seems kind of empty in here...
				</p>
			</section>
			<section id="story-bookshelf-config">
				<div id="story-bookshelf-config-upload"
					 ref="uploadRef"
					 :class="{ dragging: isUserDragging }">
					<template v-if="loadingAmount">
						<RefreshCw></RefreshCw>
						<b>{{ 'Uploading ' + loadingAmount + ' file' + (loadingAmount > 1 ? 's' : '') }}</b>
					</template>
					<template v-else>
						<Upload></Upload>
						<b>{{ isUserDragging? 'Drop File': 'Upload' }}</b>
					</template>
				</div>
				<input type="file"
					   ref="fileInputRef" />

				<div id="story-bookshelf-config-settings">
					<div id="story-bookshelf-config-settings-button"
						 @click="show_sort_setting = !show_sort_setting">
						<SortDesc></SortDesc>
					</div>
					<FadeTransition>
						<div id="story-bookshelf-config-settings-menu"
							 v-if="show_sort_setting">
							<SortSetting @close-settings="show_sort_setting = false"></SortSetting>
						</div>
					</FadeTransition>
				</div>
			</section>
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
		'content';
	grid-template-rows: 1fr 5fr;

	#bookshelf-logo {
		grid-area: logo;
	}
}

#story-bookshelf {
	grid-area: content;

	display: flex;
	flex-direction: column;

	min-height: 0;

	#story-bookshelf-stories {
		flex-grow: 1;

		background-color: lighten($BACKGROUND, 10%);
		display: flex;
		flex-direction: column;

		height: 100%;
		overflow-y: auto;

		.story {
			--completion: 0%;
			--progress-light: #{transparent};
			--progress-dark: #{lighten($BACKGROUND, 5%)};

			padding: 1rem 2rem;
			background-color: transparent;
			transition: background 200ms ease;

			cursor: pointer;

			&:hover {
				--progress-light: #{transparentize(black, 0.9)};
				--progress-dark: #{lighten($BACKGROUND, 2%)};
			}

			background: linear-gradient(90deg, var(--progress-dark) var(--completion), var(--progress-light) var(--completion));

			.story-title,
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

		#story-bookshelf-empty {
			text-align: center;
			opacity: 50%;
		}
	}

	#story-bookshelf-config {
		display: grid;
		grid-template-columns: 4fr 1fr;

		>* {
			cursor: pointer;
		}

		#story-bookshelf-config-upload {
			display: grid;
			place-items: center;
			padding: 1rem;

			background-color: darken($BACKGROUND, 5%);
			transition: background-color 200ms ease-in-out;

			&:hover {
				background-color: darken($BACKGROUND, 2%);
			}

			&.dragging {
				background-color: darken($BACKGROUND, 0%);
			}

			b {
				display: none;
			}

			@media screen and (min-width: 30rem) {
				& {
					display: flex;
					flex-direction: row;
					justify-content: center;
					gap: 0.5rem;
				}

				b {
					display: block;
				}
			}
		}

		#story-bookshelf-config-settings {
			position: relative;

			#story-bookshelf-config-settings-button {
				height: 100%;
				background-color: darken($BACKGROUND, 10%);
				transition: background-color 200ms ease-in-out;

				&:hover {
					background-color: darken($BACKGROUND, 3%);
				}

				display: grid;
				place-items: center;
			}

			#story-bookshelf-config-settings-menu {
				position: absolute;
				bottom: 100%;
				right: 0;
				width: 100%;
			}

		}
	}
}

input[type=file] {
	display: none;
}
</style>