export type StoredMessage = {
  id: number;
  chat_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type Chat = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};
