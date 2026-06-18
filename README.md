# Eco-LLM Proxy

A Chrome Extension (Manifest V3) that routes AI prompts to frugal local models and estimates CO2 savings.

## What it does
- **Detects** prompts submitted to ChatGPT and Claude.
- **Classifies** prompts using heuristics and DistilBERT ONNX.
- **Routes** simple prompts locally, saving compute and CO2.
- **Calculates** real-time CO2 savings based on grid intensity via the Electricity Maps API.

## Architecture
- React for the popup dashboard.
- Vanilla JS for content scripts to avoid heavy injected bundles.
- Service worker for background classification and state management.
- `vite` for fast building and bundling.

## Setup Instructions

### Build
1. Make sure you have Node.js installed.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to compile the extension.
4. The compiled extension will be output to the `dist/` folder.

### Load into Chrome
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer Mode** in the top right.
3. Click **Load unpacked**.
4. Select the `dist/` directory generated in the previous step.

## Configuration
To get real-time carbon intensity data, obtain an API key from [Electricity Maps](https://electricitymaps.com/) and enter it in the extension settings popup. If no key is provided, the extension falls back to sensible regional defaults.

## Limitations
- DistilBERT is used for intent classification and simple extractive tasks, it is not a general-purpose text generator.
- DOM structures on ChatGPT/Claude change frequently, which may break the content script.
- CO2 calculations are approximations based on research.

## Citations
- Green AI / efficient NLP: arXiv 2404.01157
- DitchCarbon research: ChatGPT estimated CO2/request and DistilBERT comparison
- Electricity Maps API: real-time grid carbon intensity
