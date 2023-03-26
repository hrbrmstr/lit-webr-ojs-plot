import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

class RegionPlot extends LitElement {
	
	static properties = {
		region: { type: String },
		worldPhones: { type: Array }
	};
	
	static styles = [
		css`
		:host div {
			margin-top: 2rem;
			margin-bottom: 2rem;
		}
		`
	];
	
	async connectedCallback() {
		super.connectedCallback();
		
		this.addEventListener('regionChanged', async (e) => {
			this.region = e.detail.value;
		});
		
	}
	
	performUpdate() {
		super.performUpdate();
		const options = {
			detail: { value: this.region },
			bubbles: true,
			composed: true,
		};
		this.dispatchEvent(new CustomEvent(`regionChanged`, options));
	}
	
	constructor() {
		super();
		this.region = ''
		this.worldPhones = []
	}
	
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
					fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol'
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
		
	}
	
	customElements.define('region-plot', RegionPlot);
	