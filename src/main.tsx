import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "styled-components";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme, type ThemeConfig } from "@chakra-ui/react";
import { attachConsole } from "tauri-plugin-log-api";
import "@heelix-app/design/index.css";
import { ChatEntry } from "./Entry";
import { theme } from "./theme";

const queryClient = new QueryClient();
const chakraTheme: ThemeConfig = extendTheme(theme);

attachConsole();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <ChakraProvider theme={chakraTheme}>
          <ChatEntry />
        </ChakraProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
