import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
// @ts-ignore
import path from 'path/posix'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		VitePWA({
			includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
			registerType: 'autoUpdate',
			manifest: {
				name: 'Bookshelf',
				short_name: 'Bookshelf',
				description: 'A small FiMFiction story reader',
				theme_color: '#121317',
				background_color: '#121317',
				orientation: 'portrait',
				display: 'standalone',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: 'icons/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'icons/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: 'icons/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable',
					},
				],
			},
		}),
	],
	resolve: {
		preserveSymlinks: true,
		alias: {
			'@': path.resolve(__dirname, '/src'),
			path: 'path-browserify',
		},
	},
	esbuild: {
		jsxFactory: 'h',
		jsxFragment: 'Fragment',
	},
})
