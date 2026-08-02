export type SourceType = "text" | "telegram_post";

export interface NormalizedInput {
  sourceType: SourceType;
  rawInput: string;
  text: string;
}

export interface ExtractedFacts {
  claims: string[];
  dates: string[];
  numbers: string[];
  names: string[];
  links: string[];
}

export interface SourceCandidate {
  url: string;
  title: string;
  snippet: string;
  confidence?: number;
  reason?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  date: number;
  chat: TelegramChat;
  text?: string;
  caption?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}
