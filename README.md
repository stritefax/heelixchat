# Heelix Chatbot

https://github.com/user-attachments/assets/b3c46810-9598-4af5-901b-9c775915ddbc


The open-source chatbot making RAG seamless. 

Heelix is a desktop chat app written in Rust and Tauri, automatically augmenting LLM queries using text data from your machine collected via accessibility API and OCR. 

- The app  collects text from documents visible in the foreground
- Collected content organized into local SQL and vector databases
- Top K results automatically injected into LLM query as context
- Full privacy, only local data storage, use your own API key with Claude or OpenAI

## Why we built Heelix
- We wanted to build an app that makes it lighting fast to reference everything you've read on any app when interacting with LLMs - no high spec requirements or massive battery consumptions, no API integration, just install and the it works. All while maintaining privacy and full user control. 

## Requirements

- Install Node 18 (recommended: https://github.com/nvm-sh/nvm, normal install: https://nodejs.org/en/download/package-manager)
- Install rust https://www.rust-lang.org/tools/install
- Install tesseract (optional) https://tesseract-ocr.github.io/tessdoc/Installation.html

## How to run

```
npm install
npm run tauri dev
```

If you have dependencie issues when running the app, try to delete `package-lock.json` & run `npm install` again. Add your API keys before using the app. Heelix currently uses small-3 embeddings. 

## How to build

```
npm install
npm run tauri build
```
