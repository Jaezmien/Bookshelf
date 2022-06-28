import { h, defineComponent } from 'vue'
import { FiMHTMLTree } from '@/libs/FiMParser'

function copyObject(obj: any) {
	return obj && Object.keys(obj).length ? JSON.parse(JSON.stringify(obj)) : {}
}

// eugh
function recursiveRender(content: string | object) {
	if( typeof content === 'string' ) {
		return <p class='cow-line'>{ CowLine.methods!.sanitize_string(content) }</p>
		// if( !this.config || !this.configTextRegex?.test(this.content) ) {
			// return <p>{ this.sanitize_string(this.content) }</p>
		// }
		// const line_index = parseInt( this.content.replace(this.config.imageFormatText, '') )
		// const img_filename = this.content.replace(this.config.imageFormatText, this.config.imageFormatFile)
		// const img_filetype = this.config.imageGIFIndex && this.config.imageGIFIndex.includes(line_index) ? '.gif' : '.png'
		// return <img src={this.fetch_image(img_filename + img_filetype)}>line_index</img>
	}
	else {
		const htmlContent = content as FiMHTMLTree
		const ContentTag = htmlContent.tag

		const attrs = CowLine.methods!.sanitize_attr(htmlContent.attr)

		if( htmlContent.children ) {
			return (<ContentTag {...attrs}>
				{
					htmlContent.children!.map((child):any => {
						if (typeof child === 'string') return CowLine.methods!.sanitize_string(child)
						return recursiveRender(child)
					})
				}
			</ContentTag>)
		}

		return <ContentTag {...attrs}>{ htmlContent.data }</ContentTag>
	}
}

const CowLine = defineComponent({
	props: {
		content: {
			type: [String, Object],
			required: true,
		},
		// config: {
			// type: Object as PropType<BookshelfStoryConfig>,
			// required: false,
		// }
	},

	computed: {
		// configTextRegex() {
			// if(!this.config) return undefined
			// return new RegExp(this.config.imageFormatText, 'g')
		// }
	},

	methods: {
		sanitize_string(str: string) {
			return (str || '').replace(/\.\.\.(?=\S)/g, '...\u200B')
		},
		sanitize_attr(_attr: any) {
			if (!_attr || !Object.keys(_attr).length) return { class: 'cow-line' }

			const attr = copyObject(_attr)
			if(attr.src) attr.src = this.fetch_image(attr.src)
			if(attr.class) {
				if(Array.isArray(attr.class)) attr.class.push('cow-line')
				else attr.class = (attr.class + ' cow-line').trim()
			}
			else attr.class = 'cow-line'
			/*attr.attrs = {}
			if (attr.hasOwnProperty('src')) {
				attr.attrs.src = this.fetch_image(attr.src)
				delete attr.src
			}*/

			return attr
		},

		// Modify if needed.
		fetch_image(src: string) {
			// if (this.story.blobImages && this.story.blobImages[src]) return this.story.blobImages[src]
			if(src.startsWith('https://camo.fimfiction.net/')) {
				const url = new URL(src)
				return url.searchParams.get("url")
			}
			return src
		},
	},
	
	render() {
		return recursiveRender(this.content);
	}
})

export default CowLine;