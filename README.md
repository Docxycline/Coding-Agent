# FitGPT

FitGPT is an AI-powered fitness assistant built with Next.js, OpenAI, and Astra DB. The app lets users chat with a fitness-focused coach, while the backend retrieves relevant context from a vector database to improve the quality of responses.

## Features

- Conversational fitness coaching experience in the browser
- Prompt suggestions for quick starting points
- Retrieval-augmented generation (RAG) using Astra DB and embeddings
- Content seeding script that scrapes and stores fitness-related text for retrieval

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- OpenAI API
- Vercel AI SDK
- LangChain
- DataStax Astra DB
- Puppeteer

## Prerequisites

Before running the project, make sure you have:

- Node.js 18 or newer
- npm
- An OpenAI API key
- A DataStax Astra DB account with namespace, endpoint, and application token

## Environment Variables

Create a file named .env.local in the project root and add the following variables:

```bash
ASTRA_DB_NAMESPACE=your_astra_namespace
ASTRA_DB_COLLECTION=your_collection_name
ASTRA_DB_API_ENDPOINT=your_astra_endpoint
ASTRA_DB_APPLICATION_TOKEN=your_astra_token
OPENAI_API_KEY=your_openai_api_key
```

## Installation

Install dependencies:

```bash
npm install
```

Seed the vector database with sample content:

```bash
npm run seed
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 to view the app.

## Project Structure

- app/page.tsx: Main chat UI
- app/api/chat/route.ts: Handles chat requests and retrieves relevant context
- scripts/loadDb.ts: Scrapes content, splits it into chunks, creates embeddings, and stores them in Astra DB
- app/components: Reusable chat UI components

## Build

To create a production build:

```bash
npm run build
```

## Notes

- The seed script currently uses a small set of fitness-related pages and can be expanded with your own sources.
- The app uses OpenAI embeddings and chat completions to generate responses grounded by retrieved context.
