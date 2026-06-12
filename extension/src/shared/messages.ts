// Message types exchanged between popup ↔ background ↔ content script

export type MessageType =
  | 'INSERT_PROMPT'
  | 'GET_SELECTION'
  | 'SELECTION_RESULT'
  | 'SAVE_SELECTION'
  | 'SAVE_DONE'
  | 'PING';

export interface InsertPromptMessage {
  type: 'INSERT_PROMPT';
  text: string;
}

export interface GetSelectionMessage {
  type: 'GET_SELECTION';
}

export interface SelectionResultMessage {
  type: 'SELECTION_RESULT';
  text: string;
}

export interface SaveSelectionMessage {
  type: 'SAVE_SELECTION';
  text: string;
}

export interface SaveDoneMessage {
  type: 'SAVE_DONE';
  promptId: string | null;
  error?: string;
}

export interface PingMessage {
  type: 'PING';
}

export type ExtensionMessage =
  | InsertPromptMessage
  | GetSelectionMessage
  | SelectionResultMessage
  | SaveSelectionMessage
  | SaveDoneMessage
  | PingMessage;
