---
{
  "title": "Telephones by region (Lit + WebR + Observable Plot)",
  "og" : {
    "site_name": "WebR Exeriments",
    "url": "https://rud.is/w/lit-webr-plot",
    "description": "Lit + WebR + OJS Plot version of one of the original Shiny demo apps",
    "image": {
      "url": "https://rud.is/w/lit-webr-plot/img/preview.png",
      "height": "768",
      "width": "1536",
      "alt": "Base R bar plot"
    }
  },
  "twitter": {
    "site": "@hrbrmstr",
    "domain": "rud.is"
  }
}
---

# 🧪 Lit + WebR + Observable Plot

<status-message id="status"></status-message>

## Linking Lit's Lightweight Web Components And WebR For Vanilla JS Reactivity 

### This is a Lit + WebR + [Observable Plot](https://github.com/observablehq/plot) reproduction of the [OG Shiny Demo App](https://shiny.rstudio.com/gallery/telephones-by-region.html)

<region-plot id="regionsOutput" svgId="lit-regions">
  <select-list label="Select a region:" id="regionsInput"></select-list>
</region-plot>

### 'Sup?

Yesterday brought [lit-webr](https://rud.is/w/lit-webr/), to introduce [Lit](lit.dev) and basic reactivity.

Today, is more of the same, but we bring the OG Shiny demo plot into the modern age by using Observbable Plot to make the charts. 

We're still pulling data from R, but we're letting Plot do all the heavy lifting.

Here's what's changed…

First, `main.js` no longer has an {svglite} dependency. This means slightly faster load times, and less code. After ensuring we have `datasets` available, this is remainder of what happens _(please see the larger example for more extended "what's goin' on?" comments)_:

```js
//  WE WILL TALK ABOUT THIS BELOW
import { webRDataFrameToJS } from './utils.js'

const regions = document.getElementById("regionsInput")
const plotOutput = document.getElementById("regionsOutput")

regions.options = await (await R.webR.evalR(`colnames(WorldPhones)`)).toArray()

//  WE WILL TALK ABOUT THIS BELOW
plotOutput.worldPhones = webRDataFrameToJS(
  await (await webR.evalR(
    `as.data.frame.table(WorldPhones, stringsAsFactors=FALSE) |> 
       setNames(c("year", "region", "phones"))`
  )).toJs())

plotOutput.region = regions.options[ 0 ]
```

The `webRDataFrameToJS()` function in `utils.js` was mentioned in a previous experiment. Its sole mission in life is to turn the highly structured object that is the result of calling WebR's `toJs()` function on an R `data.frame`. Most JS data things like the structure `webRDataFrameToJS()` puts things into, and Observable Plot is a cool JS data thing.

The ugly `await… await…` sequence is to get the data from R to give to `webRDataFrameToJS()`.  We got lucky thins time since `as.data.frame.table` does a _niiice_ job taking the `WorldPhones` rownamed matrix and pivoting it longer.

We store the output of that into the `region-plot` component. I could/should have made it a private property, but no harm, no foul in this setting.

Lastly, in `region-plot.js`, our component is reduced to two properties: one to store the region name and one for the data you saw, above. We still use events to trigger updates between the popup and the plotter, and said plotter is doing this in `render()`:

```js
render() {
return html`
<div>
<slot></slot>
${
  Plot.plot({
    style: {
      background: "#001e38",
      color: "#c6cdd7",
      padding: "30px",
      fontSize: "10pt",
      fontFamily: '-apple-system, BlinkMacSystemFont, …'
    },
    inset: 10,
    marginLeft: 60,
    caption: "Data from AT&T (1961) The World's Telephones",
    x: {
      label: null,
      type: "band"
    },
    y: {
      label: "Number of ☎️ (K)",
      grid: true
    },
    marks: [
      Plot.barY(
        this.worldPhones.filter((d) => d.region === this.region),
        { x: "year", y: "phones", fill: "#4a6d88" }
      ),
      Plot.ruleY([0])
    ]
  })
}
</div>`;
}
```

When the `region` changes, it triggers a reactive update. When the refresh happens, this snippet:

```js
 this.worldPhones.filter((d) => d.region === this.region)
 ```

 does the hard work of filtering out all but the region we selected from the tiny, in-memory phones "database".

 Plot may not be {ggplot2}, but it cleans up well, and we've even had it match the style we used in the previous experiment.

<p style="text-align:center;margin-top:2rem;">Brought to you by @hrbrmstr</p>
