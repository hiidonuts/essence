// Shared in-memory data store for all API endpoints
let threads = {}; // { threadId: { id, title, messages: [{id, sender, content, timestamp}], createdAt, updatedAt } }
let nextThreadId = 1;
let nextMessageId = 1;

export const getThreads = () => threads;
export const setThreads = (newThreads) => { threads = newThreads; };
export const getNextThreadId = () => nextThreadId++;
export const getNextMessageId = () => nextMessageId++;
