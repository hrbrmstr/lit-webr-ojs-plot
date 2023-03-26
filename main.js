/**
 * @module main
 */

// we need to render the markdown as quickly as possible
import { renderMarkdownInBody } from "./renderers.js";

await renderMarkdownInBody(
	`main`,
	"ayu-dark",
	[ 'javascript', 'r', 'json', 'md', 'xml', 'console' ],
	false
)

// update our status component
let message = document.getElementById("status");
message.text = "WebR Loading…"

// crank up WebR
import * as R from "./r.js";

message.text = "Web R Initialized!"

await R.library(`datasets`)

import { webRDataFrameToJS } from './utils.js'

// find our other components
const regions = document.getElementById("regionsInput")
const plotOutput = document.getElementById("regionsOutput")

// get them initialized
regions.options = await (await R.webR.evalR(`colnames(WorldPhones)`)).toArray()

plotOutput.worldPhones = webRDataFrameToJS(await (await webR.evalR(`as.data.frame.table(WorldPhones, stringsAsFactors=FALSE) |> 
  setNames(c("year", "region", "phones"))`)).toJs())

plotOutput.region = regions.options[ 0 ]

// it's all in the hands of the user now
message.text = "Ready"
