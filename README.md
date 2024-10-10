# Heelix Chat

Heelix is a ai chat app, which enhances llm capabilities by adding context

- The app periodically collects data as documents while active in the background
- Collected content is querried and appended to promts to generate better context

## Prerequisite

- Install Node 18 (recommended: https://github.com/nvm-sh/nvm, normal install: https://nodejs.org/en/download/package-manager)
- Install rust https://www.rust-lang.org/tools/install
- Install tesseract https://tesseract-ocr.github.io/tessdoc/Installation.html

## How to run

```
npm install
npm run tauri dev
```

If you have dependencie issues when running the app, try to delete `package-lock.json` & run `npm install` again

## How to build

```
npm install
npm run tauri build
```
