<template>
	<i :data-feather="icon"
	   :style="{ width: size, height: size }"></i>
</template>

<script setup lang="ts">
import feather from 'feather-icons'
import { onMounted, onUpdated } from 'vue';

defineProps({
	icon: {
		type: String,
		default: 'feather'
	},
	size: {
		type: String,
		default: '24px'
	}
})

onMounted(() => feather.replace())
onUpdated(() => feather.replace())
</script>

<style scoped>
i {
	stroke: currentColor;
	stroke-width: 2;
	stroke-linecap: round;
	stroke-linejoin: round;
	fill: none;
}
</style>