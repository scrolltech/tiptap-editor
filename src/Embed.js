import { Node } from "tiptap";
import axios from "axios";

export default class EmbedNode extends Node {
  get name() {
    return "embed";
  }

  get schema() {
    return {
      attrs: {
        src: {
          default: null
        },
        caption: {
          default: null
        }
      },
      group: "block",
      selectable: false,
      // parseDOM and toDOM is still required to make copy and paste work
      parseDOM: [
        {
          tag: this.name,
          getAttrs: dom => {
            return {
              src: dom.getAttribute("src"),
              caption: dom.getAttribute("caption")
            };
          }
        }
      ],
      toDOM: node => ["embed", node.attrs]
    };
  }

  commands({ type }) {
    return () => (state, dispatch) =>
      dispatch(state.tr.replaceSelectionWith(type.create()));
  }

  get view() {
    const options = this.options;
    return {
      props: ["node", "updateAttrs", "view"],
      data() {
        return {
          embeds: {
            isLoading: false,
            isError: false,
            data: null
          }
        };
      },
      mounted() {
        if (this.src) {
          this.embeds.data = { iframeUrl: this.src };
        } else {
          this.$nextTick(() => {
            this.$refs.embedInput.focus();
          });
        }
      },
      computed: {
        src: {
          get() {
            return this.node.attrs.src;
          },
          set(src) {
            this.updateAttrs({
              src
            });
          }
        },
        caption: {
          get() {
            return this.node.attrs.caption;
          },
          set(caption) {
            this.updateAttrs({
              caption
            });
          }
        }
      },
      methods: {
        async onClick() {
          options.changeToLink(this.src);
          if (!this.src) return;
          this.embeds.isLoading = true;
          this.embeds.isError = false;
          try {
            const response = await axios("http://localhost:3000/embeds");
            this.embeds.data = response.data;
            this.src = response.data.iframeUrl;
          } catch (error) {
            this.embeds.isError = true;
          } finally {
            this.embeds.isLoading = false;
          }
        }
      },
      template: `
        <div>
          <div v-if="embeds.data">
            <iframe :src="embeds.data.iframeUrl"></iframe>
            <input type="text" v-model="caption" :disabled="!view.editable" placeholder="write caption (optional)" />
          </div>
          <div v-else>
            <div v-if="embeds.isLoading">Loading...</div>
            <input ref="embedInput" @paste.stop type="text" v-model="src" :disabled="!view.editable" />
            <button @click="onClick">Embeds</button>
          </div>
        </div>
      `
    };
  }
}