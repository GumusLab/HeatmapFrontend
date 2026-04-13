# ClusterChirp

An interactive heatmap visualization tool for exploring tabular data with on-the-fly clustering, correlation networks, pathway analysis, and an AI-powered chatbot. Built for researchers and data scientists.

**Live demo:** [https://clusterchirp.mssm.edu](https://clusterchirp.mssm.edu)

## Quick Start with Docker

The easiest way to run ClusterChirp locally is with Docker. No setup required.

```bash
docker pull ghcr.io/gumuslab/clusterchirp:latest
docker run -p 8080:80 ghcr.io/gumuslab/clusterchirp:latest
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

### Enable AI Chat (Optional)

The built-in AI chatbot lets you interact with your heatmap using natural language commands (e.g., "show top 20 most variant genes", "cluster rows", "sort by variance"). It requires an OpenAI API key.

```bash
docker run -p 8080:80 -e OPENAI_API_KEY=sk-your-key ghcr.io/gumuslab/clusterchirp:latest
```

You can get an API key at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys).

All other features (heatmap visualization, clustering, correlation networks, pathway analysis) work without an API key.

## Features

- **Interactive Heatmap** — Upload CSV, TSV, or XLSX files and visualize with real-time clustering
- **AI Chatbot** — Natural language commands to filter, sort, cluster, and explore your data
- **Correlation Networks** — Visualize gene correlation networks in 2D and 3D
- **Pathway Analysis** — Enrichment analysis with KEGG, Reactome, WikiPathway, and more
- **Example Datasets** — Preloaded proteomics, genomics, and immunogenomics datasets to explore

## Development Setup

### Prerequisites

- Node.js >= 18
- Python 3.11+
- Backend repo: [GumusLab/HeatmapBackend](https://github.com/GumusLab/HeatmapBackend)

### Frontend

```bash
npm install
npm start
```

Runs on [http://localhost:3000](http://localhost:3000).

### Backend

See the [HeatmapBackend](https://github.com/GumusLab/HeatmapBackend) repo for backend setup instructions.

## Architecture

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, deck.gl, MUI |
| Backend | Django, Django REST Framework |
| Clustering | scipy, scikit-learn, numba |
| AI Chat | OpenAI GPT-4o-mini |
| Docker | nginx + gunicorn + supervisord |

## Citation

If you use ClusterChirp in your research, please cite:

> Rawal, O., et al. "ClusterChirp: A GPU-accelerated Web Server for Natural Language-Guided Interactive Visualization and Analysis of Large Omics Data." arXiv preprint (2026).
> [https://doi.org/10.48550/arXiv.2602.08280](https://doi.org/10.48550/arXiv.2602.08280)

## License

This project is developed by the [Gumus Lab](https://github.com/GumusLab) at the Icahn School of Medicine at Mount Sinai.

ClusterChirp is freely available for all users. No registration required.
