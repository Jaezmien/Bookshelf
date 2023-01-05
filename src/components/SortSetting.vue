<script setup lang="ts">
import { SettingSort, useSettingStore } from '@/stores/settings';
import { onMounted, onUnmounted } from 'vue';

const emits = defineEmits(['close-settings'])

const settings = useSettingStore()

function is_element_child(child: HTMLElement) {
	let ch: HTMLElement | null = child;
	while (ch && ch.id !== "story-bookshelf-config-settings") ch = ch.parentNode as (HTMLElement | null);
	return ch !== null;
}

function on_mouse_click(ev: MouseEvent) {
	if (ev.target) {
		const target = ev.target as HTMLElement
		if (is_element_child(target)) return;
		emits('close-settings')
		ev.preventDefault()
		ev.stopPropagation()
	}
}

onMounted(() => {
	window.addEventListener('mousedown', on_mouse_click)
})
onUnmounted(() => {
	window.removeEventListener('mousedown', on_mouse_click)
})
</script>

<template>
	<div>
		<p v-for="sort in settings.sort_options"
		   :key="'sort-' + sort"
		   :class="{ active: settings.Sort === sort }"
		   @click="() => {
		   	if (settings.Sort === sort) return;
		   	settings.Sort = sort as SettingSort
		   	settings.save_settings()
		   	emits('close-settings')
		   }">
			{{ sort }}
		</p>
	</div>
</template>

<style lang="scss" scoped>
$BACKGROUND: #1f2229;

div {
	display: flex;
	flex-direction: column-reverse;

	background-color: darken($BACKGROUND, 10%);
	text-align: right;

	p {
		padding: 1rem 1rem;
		margin: 0;

		cursor: pointer;

		&:hover {
			background-color: darken($BACKGROUND, 3%);
		}

		&.active {
			background-color: darken($BACKGROUND, 5%);

			&:hover {
				background-color: darken($BACKGROUND, 0%);
			}
		}
	}
}
</style>