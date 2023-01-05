import { useFileStore } from '@/stores/files'
import { FIMChapterContent, FIMChapterNode } from 'fimfic-parser'
import { defineComponent, h, inject } from 'vue'

let j = h // prettier won't shut up

function copyObject(obj: any) {
	return obj && Object.keys(obj).length ? JSON.parse(JSON.stringify(obj)) : {}
}

// eugh
function recursiveRender(content: String | FIMChapterContent, cowline: InstanceType<typeof CowLine>) {
	if( typeof content === 'string' ) {
		return <p class='cow-line'>{ cowline.sanitize_string(content) }</p>
	}
	else {
		const htmlContent = content as FIMChapterNode

		if( htmlContent.tag === "img" && htmlContent.attributes?.src ) {
			return <CowImage url={htmlContent.attributes.src}></CowImage>
		}

		const ContentTag = htmlContent.tag
		const attrs = cowline.sanitize_attributes(htmlContent.attributes)

		if( htmlContent.children ) {
			return (<ContentTag {...attrs}>
				{
					htmlContent.children!.map(child => {
						if (typeof child === 'string') return cowline.sanitize_string(child)
						return recursiveRender(child, cowline)
					})
				}
			</ContentTag>)
		}

		return <ContentTag {...attrs}>{ htmlContent.data }</ContentTag>
	}
}

const CowImage = defineComponent({
	setup() {
		const fileStore = useFileStore()
		const imageLoad = inject('imageHasLoaded', () => {})
		return {
			fileStore,
			imageLoad
		}
	},

	props: {
		url: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			src: ''
		}
	},

	render() {
		return (
			<img class='cow-line' src={this.src}
				onLoad={() => this.imageLoad() }
			/>
		)
	},

	mounted() {
		this.fileStore.cached_image(this.url)
			.then(url => { this.src = url })
			.catch(() => { this.src = this.url })
	}
})

const CowLine = defineComponent({
	setup() {
		const fileStore = useFileStore()
		return {
			fileStore
		}
	},
	props: {
		content: {
			type: [String, Object],
			required: true,
		},
	},

	methods: {
		sanitize_string(str: string) {
			return (str || '').replace(/\.\.\.(?=\S)/g, '...\u200B')
		},
		sanitize_attributes(_attr: any) {
			if (!_attr || !Object.keys(_attr).length) return { class: 'cow-line' }

			const attr = copyObject(_attr)
			if(attr.class) {
				if(Array.isArray(attr.class)) attr.class.push('cow-line')
				else attr.class = (attr.class + ' cow-line').trim()
			}
			else attr.class = 'cow-line'

			return attr
		},

		fetch_image(src: string) {
			return this.fileStore.cached_image(src);
		},
	},
	
	render() {
		return recursiveRender(this.content as (String | FIMChapterContent), this);
	}
})

export default CowLine;