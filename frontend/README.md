# Sentiment Hub Pro

i am building a Text Sentiment Analyser by Transformer-Based BERT Model , more specifically a product review sentiment analyzer . so i want admin front end for this . such if you are admin you can see all the products . and then after clicking on a product you see the reviews it has gotten . then all reviews have color coding green for positive grey for neutral and red for negative . and then there is also an aggregate rating for the product with the combined rating of all . so build the front end now

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c9a2e1e9-1d43-43f3-a539-2ff9387510ef).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

### Run with the FastAPI backend

From the repository root, start the backend first. It loads the aspect extraction and sentiment models before accepting requests:

```sh
pip install -r requirements.txt
# Set GROQ_API_KEY in your environment before starting the backend.
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

The aspect splitter calls Groq using `GROQ_API_KEY`. Copy `backend/.env.example` as a reference for the required key and optional `GROQ_ASPECT_MODEL` setting (defaults to `openai/gpt-oss-120b`); export these environment variables in the shell or configure them in your deployment environment. Do not commit API keys.

Then start the frontend from the `frontend` directory:

```sh
npm install
npm run dev -- --host 0.0.0.0 --port 8080
```

The frontend defaults to `http://localhost:8000` for the API. To use a different backend URL, set `VITE_API_BASE_URL` in `frontend/.env.local` (see `.env.example`) and restart the frontend. The backend allows loopback origins for local development; set `FRONTEND_ORIGINS` to a comma-separated list of exact origins for other deployments.
