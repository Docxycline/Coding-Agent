# Qinser — AI Coding Agent

Qinser is a full-stack AI coding agent built with Next.js, LangGraph, and Groq. It can read, write, edit, and execute files on your local machine through a chat interface, with persistent memory across sessions powered by PostgreSQL.

## Demo

> Ask Qinser to read a file, search your codebase, run a command, or write new code — it uses real tools that execute on your machine.

## Features

- **Local file system access** — read, write, edit files directly on your machine
- **Terminal execution** — run any command and see the output
- **Codebase search** — find any string across all files in a directory
- **Persistent memory** — conversations are saved to PostgreSQL and remembered across sessions
- **Streaming responses** — word-by-word streaming just like ChatGPT
- **ReAct loop** — agent reasons, acts with tools, observes results, and repeats until done

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| AI Framework | LangGraph (ReAct agent loop) |
| LLM | Groq — llama-3.3-70b-versatile |
| Memory | PostgreSQL via Neon + LangGraph PostgresSaver |
| Tools | Custom filesystem + shell tools |
| Streaming | Vercel AI SDK |

## Architecture

```
User message
     ↓
Next.js API Route (route.ts)
     ↓
LangGraph StateGraph
     ↓
Agent Node (LLM decides what to do)
     ↓
shouldContinue() — needs a tool?
     ↓ yes                    ↓ no
Tool Node                  Stream response
(executes tool)            back to user
     ↓
Back to Agent Node
(loop until done)
```

**Persistent memory flow:**
Every conversation has a `thread_id` stored in localStorage. On each request, LangGraph loads the full conversation history from Neon Postgres using that ID, runs the agent, and saves the updated state back.

## Tools

| Tool | Description |
|---|---|
| `read_file` | Read the contents of any file |
| `write_file` | Create or overwrite a file |
| `edit_file` | Make targeted edits to specific content |
| `execute_code` | Run terminal commands and return output |
| `list_directory` | List files and folders in a directory |
| `search_in_files` | Search for any string across files recursively |

All tools have safety guards — blocked paths (`node_modules`, `.git`, `.env`) and blocked commands (`rm -rf`, `git push`, etc).

## Getting Started

### Prerequisites

- Node.js 18+
- A [Groq](https://console.groq.com) account (free)
- A [Neon](https://neon.tech) account (free)

### Installation

```bash
git clone https://github.com/yourusername/qinser
cd qinser/app
npm install
```

### Environment Variables

Create a `.env` file inside the `app` folder:

```env
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=your_neon_postgres_connection_string
```

### Run

```bash
cd app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage Examples

```
list all files in C:\Users\yourname\myproject

read C:\Users\yourname\myproject\index.ts and explain what it does

search for "useState" in C:\Users\yourname\myproject

create a new file at C:\Users\yourname\myproject\utils\helper.ts with a function that formats dates

run "npm test" in C:\Users\yourname\myproject
```

## Project Structure

```
app/
├── api/
│   └── chat/
│       └── route.ts          # Next.js API route — runs the LangGraph agent
├── components/
│   ├── Bubble.tsx            # Chat message bubble
│   ├── LoadingBubble.tsx     # Animated loading indicator
│   ├── PromptSuggestionButton.tsx
│   └── PromptSuggestionsRow.tsx
├── lib/
│   ├── agent.ts              # LangGraph StateGraph — ReAct loop
│   ├── checkpointer.ts       # PostgreSQL memory setup
│   └── tools.ts              # All filesystem + shell tools
├── page.tsx                  # Main chat UI
├── layout.tsx
└── globals.css
```

## Known Limitations

- **Token limits** — Groq free tier has low TPM limits. Long conversations with large file reads can hit rate limits. Upgrade to Groq Dev tier or clear conversation history between sessions.
- **Windows paths** — tested on Windows. Unix paths (`/home/user/...`) should work too but not extensively tested.
- **No sandboxing** — tools execute real commands on your machine. Don't run untrusted prompts.

## Roadmap

- [ ] Message summarization to handle long conversations
- [ ] Workspace folder UX — set a root directory once instead of typing full paths
- [ ] Code review step before writing files
- [ ] Web search tool for looking up docs
- [ ] Support for multiple conversation threads

## License

MIT