const express = require('express');
const router = express.Router();

const threads = {}; // { threadId: { id, title, messages: [{id, sender, content, timestamp}], createdAt, updatedAt } }
let nextThreadId = 1;
let nextMessageId = 1;

function getUserId(req) {
  return req.headers['x-user-id'] || 'anonymous';
}

router.get('/', (req, res) => {
  const userId = getUserId(req);
  const list = Object.values(threads).filter(t => t.user === userId);
  res.json(list);
});

router.post('/', (req, res) => {
  const userId = getUserId(req);
  const id = String(nextThreadId++);
  const thread = { id, user: userId, title: req.body.title || 'Untitled', messages: [], createdAt: new Date(), updatedAt: new Date() };
  threads[id] = thread;
  res.json(thread);
});

router.post('/:threadId/messages', (req, res) => {
  const userId = getUserId(req);
  const thread = threads[req.params.threadId];
  if (!thread) return res.sendStatus(404);
  if (thread.user !== userId) return res.sendStatus(403);
  const msg = { id: String(nextMessageId++), sender: userId, content: req.body.content, timestamp: new Date() };
  thread.messages.push(msg);
  thread.updatedAt = new Date();
  res.json(msg);
});

router.get('/:threadId', (req, res) => {
  const thread = threads[req.params.threadId];
  if (!thread) return res.sendStatus(404);
  res.json(thread);
});

module.exports = router;
