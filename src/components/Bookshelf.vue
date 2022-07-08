<script setup lang="ts">
defineProps({
	clickable: {
		type: Boolean,
		default: false
	}
})
defineEmits(['book:click'])
</script>

<template>
	<div id="bookshelf-logo">
		<div :class="{ clickable }"
			 @click="() => clickable && $emit('book:click')">
			<div>
				<svg version="1.1"
					 style="fill:none; stroke:currentColor;"
					 viewBox="0 0 135 135"
					 id="header-icon"
					 xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
					 xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
					 xmlns="http://www.w3.org/2000/svg"
					 xmlns:svg="http://www.w3.org/2000/svg">
					<defs id="defs12" />
					<path style="fill:none;stroke-width:15px;stroke-linecap:round;stroke-linejoin:round"
						  d="" />
					<path style="fill:none;stroke-width:15px;stroke-linecap:round;stroke-linejoin:round"
						  d="" />
					<path style="fill:none;stroke-width:15px;stroke-linecap:square;stroke-linejoin:round"
						  d="m 127.5,7.5 q -60,0 -60,60 0,60 -60,60 m 0,-60 v 0 -60 m 120,60 v 0 60 m -90,-120 v 0 30 m 60,60 v 0 30 m -60,-60 a 30,30 0 0 1 -30,30 m 90,-30 a 30,30 0 0 1 30,-30" />
				</svg>

				<h1 id="header">Bookshelf</h1>

				<small>V1.1.1</small>
			</div>
		</div>
	</div>
</template>
<style lang="scss" scoped>
#bookshelf-logo {
	font-family: 'Roboto Slab', serif;
	text-align: center;

	display: grid;
	place-items: center;

	div {
		display: flex;
		flex-direction: row;
		place-items: center;

		padding: 0 1rem;

		#header {

			font-size: 3rem;
			margin: 0;
			margin-left: 1rem;

			@media screen and (max-width: 30rem) {
				font-size: 2rem;
			}
		}

		#header-icon {
			width: 4rem;
			height: 4rem;

			@media screen and (max-width: 30rem) {
				width: 3rem;
				height: 3rem;
			}
		}

		small {
			margin-top: auto;
			margin-left: 0.5rem;
			opacity: 0.6;
		}

	}
}

.clickable {
	cursor: pointer;
}
</style>