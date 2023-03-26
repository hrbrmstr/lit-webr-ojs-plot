# 🧪 Lit + WebR

>See it [live](https://rud.is/w/lit-webr/) before reading!

## Linking Lit's Lightweight Web Components And WebR For Vanilla JS Reactivity

### This is a Lit + WebR reproduction of the [OG Shiny Demo App](https://shiny.rstudio.com/gallery/telephones-by-region.html)

[Lit](https://lit.dev/) is a javascript library that makes it a bit easier to work with [Web Components](https://dailyfinds.hrbrmstr.dev/p/drop-227-2023-03-24-weekend-project), and is especially well-suited in reactive environments.

My recent hack-y WebR experiments have been using [Reef](https://reefjs.com/getting-started/) which is an _even ligher_-weight javascript web components-esque library, and it's a bit more (initially) accessible than Lit. Lit's focus on "Web Components-first" means that you are kind of forced into a structure, which is good, since reactive things can explode if not managed well.

I also think this might Shiny folks feel a bit more at home.

This is the structure of our Lit + WebR example _(I keep rejiggering this layout, which likely frustrates alot of folks_ 🙃)_

```console
lit-webr
├── css
│   └── style.css             # you know what this is
├── favicon.ico               # when developing locally I want my icon
├── index.html                # you know what this is
├── main.js                   # the core experiment runner
├── md
│   └── main.md               # the core experiment markdown file
├── r-code
│   └── region-plot.R         # we keep longer bits of R code in source files here
├── r.js                      # place for WebR work
├── renderers.js              # these experiment templates always use markdown
├── themes
│   └── ayu-dark.json         # my fav shiki theme
├── utils.js                  # handy utilities (still pretty bare)
├── wc
│   ├── region-plot.js        # 👉🏼 WEB COMPONENT for the plot
│   ├── select-list.js        # 👉🏼               for the regions popup menu
│   └── status-message.js     # 👉🏼               for the status message
├── webr-serviceworker.js.map # not rly necessary; just for clean DevTools console
└── webr-worker.js.map        # ☝🏽
```

A great deal has changed (due to using Lit) since the last time you saw one of these experiments. You should [scan through the source](https://github.com/hrbrmstr/lit-webr) before continuing.

The core changes to `index.html` are just us registering our web components:

```html
<script type="module" src="./wc/select-list.js"></script>
<script type="module" src="./wc/region-plot.js"></script>
<script type="module" src="./wc/status-message.js"></script>
```

We _could_ have rolled them up into one JS file and minified them, but we're keeping things simple for these experiments. 

Web Components ("components" from now on) become an "equal citizen" in terms of `HTMLElements`, and they're registered right in the DOM.

The next big change is in this file (the rendered `main.md`), where we use these new components instead of our `<div>`s. The whittled down version of it is essentially:

```html
<status-message id="status"></status-message>

<region-plot id="regionsOutput" svgId="lit-regions">
  <select-list label="Select a region:" id="regionsInput"></select-list>
</region-plot>
```

The _intent_ of those elements is pretty clear (much clearer than the `<div>` versions), which is one aspect of components I like quite a bit.

You'll also notice components are `-` (dash) crazy. That's part of the Web Components spec and is mandatory.

We're using pretty focused components. What I mean by that is that they're not very reusable across other projects without copy/paste. Part of that is on me since I don't do web stuff for a living. Part of it was also to make it easier to show how to use them with WebR.

With more modular code, plus separating out giant chunks of R source means that we can actually put the entirety of `main.js` right here _(I've removed all the annotations; please look at `main.js` to see them; we will be explaining one thing in depth here, vs there, tho.)_:

```js
import { renderMarkdownInBody } from "./renderers.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

await renderMarkdownInBody(
  `main`,
  "ayu-dark",
  [ 'javascript', 'r', 'json', 'md', 'xml', 'console' ],
  false
)

let message = document.getElementById("status");
message.text = "WebR Loading…"

import * as R from "./r.js";

message.text = "Web R Initialized!"

await R.webR.installPackages([ "svglite" ])

await R.library(`svglite`)
await R.library(`datasets`)

const regionRender = await globalThis.webR.evalR(await d3.text("r-code/region-plot.R"))

message.text = "{svglite} installed"

const regions = document.getElementById("regionsInput")
const plotOutput = document.getElementById("regionsOutput")

regions.options = await (await R.webR.evalR(`colnames(WorldPhones)`)).toArray()
plotOutput.region = regions.options[ 0 ]
plotOutput.renderFunction = regionRender
plotOutput.render()

message.text = "Ready"
```

I want to talk a bit about this line from `main.js`:

```js
const regionRender = await globalThis.webR.evalR(
  await d3.text("r-code/region-plot.R")
)
```

That fetches the source of the single R file we have in this app, evaluates it, and returns the evaluated value (which is an R `function` object) to javascript. This is the script:

```r
renderRegions <- function(region, id = "region-plot") {

  # our base plot theme

  list(
    panel.fill = "#001e38",
    bar.fill = "#4a6d88",
    axis.color = "#c6cdd7",
    label.color = "#c6cdd7",
    subtitle.color = "#c6cdd7",
    title.color = "#c6cdd7",
    ticks.color = "#c6cdd7",
    axis.color = "#c6cdd7"
  ) -> theme

  # get our svg graphics device amp'd
  s <- svgstring(width = 8, height = 4, pointsize = 8, id = id, standalone = FALSE)

  # setup theme stuff we can't do in barplot()
  par(
    bg = theme$panel.fill,
    fg = theme$label.color
  )

  # um, it's a barplot
  barplot(
    WorldPhones[, region],
    main = region,
    col = theme$bar.fill,
    sub = "Data from AT&T (1961) The World's Telephones",
    ylab = "Number of Telephones (K)",
    xlab = "Year",
    border = NA,
    col.axis = theme$axis.color,
    col.lab = theme$label.color,
    col.sub = theme$subtitle.color,
    col.main = theme$title.color
  )

  dev.off()

  # get the stringified SVG
  plot_svg <- s()

  # make it responsive
  plot_svg <- sub("width='\\d+(\\.\\d+)?pt'", "width='100%'", plot_svg)
  plot_svg <- sub("height='\\d+(\\.\\d+)?pt'", "", plot_svg)

  # return it
  plot_svg
  
}
```

That R function is callable _right from javascript_. Creating that ability was super brilliant of George (the Godfather of WebR). We actually end up giving it to the component that plots the barplot (see `region-plot.js`) right here:

```js
plotOutput.renderFunction = regionRender
```

We're getting a bit ahead of ourselves, since we haven't talked about the components yet. We'll do so, starting with the easiest one to grok, which is in `status-message.js` and is represented by the `<status-message></status-message>` tag.

These custom Lit components get everything `HTMLElement` has, plus whatever else you provide. I'm not going to show the entire source for `status-message.js` here as it is (lightly) annotated. We'll just cover the fundamentals, as Lit components also have alot going on and we're just using a fraction of what they can do. Here's the outline of what's in our `status-message`:

```js
export class StatusMessage extends LitElement {
  static properties = { /* things you can assign to and read from */ }
  static styles = [ /* component-scoped CSS */ ]
  constructor() { /* initialization bits */
  render() { /* what gets called when things change */ }
}
// register it
customElements.define('status-message', StatusMessage);
```

Our `status-message` `properties` just has one property:

```js
static properties = {
  text: {type: String}, // TypeScript annotations are requried by Lit
};
```

This means when we do:

```js
let message = document.getElementById("status");
message.text = "WebR Loading…"
```

we are finding our component in the DOM, then updating the property we defined. That will trigger `render()` each time, and use any component-restricted CSS we've setup.

Things get a _tad more complicated_ in `select-list.js`. We'll just cover the highlights, starting with the `properties`:

```js
static properties = {
  id: { type: String },    // gives us easy access to the id we set
  label: { type: String }, // lets us define the label up front
  options: { type: Array } // where the options for the popup will go
};
```

If you recall, this is how we used them in the source:

```html
<region-plot id="regionsOutput" svgId="lit-regions">
  <select-list label="Select a region:" id="regionsInput"></select-list>
</region-plot>
```

The `id` and `label` properties will be available right away after the custom element creation.

We start `option` with an empty list:

```js
constructor() {
  super()
  this.options = []
}
```

Our `render()` function places the `<label>` and `<select>` tags in the DOM and will eventually populate the menu once it has data:

```js
render() {
  const selectId = `select-list-${this.id}`;
  return html`
  <label for="${selectId}">${this.label} 
    <select id="${selectId}" @change=${this._dispatch}>
      ${this.options.map(option => html`<option>${option}</option>`)}
    </select>
  </label>
  `;
}
```

Their clever use of JS template strings makes it much easier than ugly string concatenation.

>That `html` in the `return` is doing _alot_ of work, and not just returning text. You gotta read up on Lit to get more info b/c this is already too long.

The way we wired up reactivity in my Reef examples felt kludgy, and even the nicer way to do it in Reef feels kludgy to me. It's _really_ nice in Lit. This little addition to the `<select>` tag:

```js
@change=${this._dispatch}
```

says to call a function named `_dispatch` whenever the value changes. That's in the component as well:

```js
_dispatch(e) {
  const options = {
    detail: e.target,
    bubbles: true,
    composed: true,
  };
  this.dispatchEvent(new CustomEvent(`regionChanged`, options));
}
```

We setup a data structure and then fire off a custom event that our plot component will listen for.  We've just linked them together on one side. Now we just need to populate the `options` list, using some data from R:

```js
const regions = document.getElementById("regionsInput")
regions.options = await (await R.webR.evalR(`colnames(WorldPhones)`)).toArray()
```

That'll make the menu appear.

Hearkening back to the `main.js` plot setup:

```js
const plotOutput = document.getElementById("regionsOutput")
plotOutput.region = regions.options[ 0 ]
plotOutput.renderFunction = regionRender
plotOutput.render()
```

we see that we:

- find the element
- set the default region to the first one in the popup
- assign our R-created rendering function to it
- and ask it nicely to render right now vs wait for someone to select something
  
The other side of that (`region-plot.js`) is a bit more complex. Let's start with the `properties`:

```js
static properties = {
  // we keep a local copy for fun
  region: { type: String },
  
  // this is where our S
  asyncSvg: { type: String },
  
  // a DOM-accessible id string (cld be handy)
  svgId: { type: String },

  // the function to be called to render
  renderFunction: { type: Function }
};
```

WebR === "async", which is why you see that `asyncSvg`. Async is great and also a pain. There are way more functions in `region-plot.js` as a result.

We have to have something in `renderFunction` before WebR is powered up since the component will be alive before that. We'll give it an anonymous async function that returns an empty SVG.

```js
this.renderFunction = async () => `<svg></svg>`
```

Oddly enough, our `render` function _does not call the plotting function_. This is what it does:

```js
render() {
  return html`
  <div>
  <slot></slot>
  ${unsafeSVG(this.asyncSvg)}
  </div>`;
}
```

This bit:

```html
<slot></slot>
```

just tells `render()` to take whatever is wrapped in the tag and shove it there (it's a bit more powerful than just that tho).

This bit:

```js
${unsafeSVG(this.asyncSvg)}
```

is just taking our string with SVG in it and letting Lit know we really want to live dangerously. Lit does its best to help you avoid security issues and SVGs are _dangerous_. 

So, how _do_ we render the plot? With **two** new functions:

```js
// this is a special async callback mechanism that 
// lets the component behave normally, but do things 
// asynchronously when necessary.
async connectedCallback() {

  super.connectedCallback();

  // THIS IS WHERE WE CALL THE PLOT FUNCTION
  this.asyncSvg = await this.renderFunction(this.region, this.svgId);

  // We'll catch this event when the SELECT list changes or when
  // WE fire it, like we do down below.
  this.addEventListener('regionChanged', async (e) => {
    this.region = e.detail.value;
    const res = await this.renderFunction(this.region, this.svgId);
    // if the result of the function call is from the R function and
    // not the anonymous one we initialized the oject with
    // we need to tap into the `values` slot that gets return
    // with any call to WebR's `toJs()`
    if (res.values) this.asyncSvg = res.values[ 0 ] ;
  });

}

// special function that will get called when we 
// programmatically ask for a forced update
performUpdate() {
  super.performUpdate();
  const options = {
    detail: { value: this.region },
    bubbles: true,
    composed: true,
  };

  // we fire the event so things happen async
  this.dispatchEvent(new CustomEvent(`regionChanged`, options));
}
```

That finished the wiring up on the plotting end.

## Serving 'Just' Desserts (Locally)

I *highly* recommend using the tiny but awesome Rust-powered [miniserve](https://dailyfinds.hrbrmstr.dev/i/87467104/miniserve-rust) to serve things locally during development:

```console
miniserve \
  --header "Cache-Control: no-cache; max-age=300" \
  --header "Cross-Origin-Embedder-Policy: require-corp" \
  --header "Cross-Origin-Opener-Policy: same-origin" \
  --header "Cross-Origin-Resource-Policy: cross-origin" \
  --index index.html \
  .
```

You can use that (once installed) from the local [justfile](https://github.com/casey/just), which (presently) has four semantically named actions:

- install-miniserve
- serve
- rsync
- github

You'll need to make path changes if you decide to use it.

## FIN

I realize this is quite a bit to take in, and — as I keep saying — most folks will be better off using WebR in Shiny (when available) or Quarto. 

Lit gives us reactivity without the bloat that comes for the ride with Vue and React, so we get to stay in Vanilla JS land. You'll notice there's no "npm" or "bundling" or "rollup" here. You get to code in whatever environment you want, and serving WebR-powered pages is, then, as simple as an `rsync`.

Drop issues at [the repo](https://github.com/hrbrmstr/lit-webr).

<p style="text-align:center;margin-top:2rem;">Brought to you by @hrbrmstr</p>
