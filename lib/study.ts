export type Passage = { id: string; text: string };
export type Card = { title: string; explanation: string; passageId: string; quote: string };
export type Question = { prompt: string; answer: string; passageId: string };
export type Study = { mode: 'source' | 'ai'; passages: Passage[]; cards: Card[]; questions: Question[] };
export const MAX_LENGTH = 12000;
export const SAMPLE = `An algorithm is a finite sequence of well-defined steps used to solve a problem. An algorithm takes an input, performs operations, and produces an output.

Linear search checks each element in a list until the target is found or the list ends. It works on both sorted and unsorted lists. In the worst case, linear search examines every element, so its time complexity is O(n).

Binary search repeatedly divides a sorted search range in half. It compares the target with the middle element and continues in the relevant half. Binary search requires sorted data and has a worst-case time complexity of O(log n).

A stack is a data structure that follows last in, first out (LIFO). The push operation adds an item to the top. The pop operation removes the top item. An undo history is one example of stack-like behavior.

A queue follows first in, first out (FIFO). Enqueue adds an item to the back, and dequeue removes an item from the front. A print queue is a common example.`;
export function passagesFrom(text: string): Passage[] {
  if (typeof text !== 'string' || text.trim().length < 60) throw new Error('Add at least 60 characters of lesson text.');
  if (text.length > MAX_LENGTH) throw new Error('Keep your lesson under 12,000 characters.');
  const blocks = text.trim().split(/\n\s*\n|\n(?=\S)/u).filter(Boolean);
  const chunks = blocks.flatMap(block => block.length <= 900 ? [block.trim()] : block.match(/[\s\S]{1,900}(?:\s|$)|[\s\S]{1,900}/gu) || []);
  return chunks.map((text, i) => ({ id: `P${i + 1}`, text: text.trim() }));
}
export function sourceStudy(text: string): Study {
  const passages = passagesFrom(text);
  const cards = passages.slice(0, 6).map(p => ({ title: p.text.split(/\s/u).slice(0, 6).join(' ') + '…', explanation: p.text, passageId: p.id, quote: p.text }));
  const questions = passages.slice(0, 3).map(p => {
    const sentence = p.text.match(/[^.!?။]+[.!?။]?/u)?.[0]?.trim() || p.text;
    const words = sentence.match(/[A-Za-z][A-Za-z-]{4,}/gu) || [];
    const answer = words.find(w => !['which','there','their','these','those','about'].includes(w.toLowerCase()));
    return answer ? { prompt: sentence.replace(answer, '________'), answer, passageId: p.id } : { prompt: `In your own words, what does ${p.id} explain? Compare your answer with the source.`, answer: sentence, passageId: p.id };
  });
  return { mode: 'source', passages, cards, questions };
}
export function validateAI(raw: unknown, passages: Passage[]): Study {
  const data = raw as { cards?: Card[]; questions?: Question[] };
  if (!data || !Array.isArray(data.cards) || !Array.isArray(data.questions) || data.cards.length < 1 || data.cards.length > 6 || data.questions.length < 1 || data.questions.length > 3) throw new Error('The model returned an incomplete study guide.');
  const field = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
  for (const card of data.cards) {
    if(!card) throw new Error('Invalid study card.');
    const source = passages.find(p => p.id === card.passageId);
    if (!source || !field(card.title, 160) || !field(card.explanation, 2400) || !field(card.quote, 901) || !source.text.includes(card.quote)) throw new Error('An explanation had an invalid source reference. The guide was not shown.');
  }
  for (const q of data.questions) {
    if (!q || !passages.some(p => p.id === q.passageId) || !field(q.prompt, 700) || !field(q.answer, 1200)) throw new Error('A practice question had an invalid source reference.');
  }
  return { mode: 'ai', passages, cards: data.cards, questions: data.questions };
}
export function findEvidence(question: string, passages: Passage[]): Passage[] {
  const stop = new Set(['what','does','that','this','with','from','have','explain','about','which','the','and','for','how','why','can','are']);
  const tokens = [...new Set((question.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || []).filter(t => t.length > 2 && !stop.has(t)))];
  return passages.map(p => ({ p, score: tokens.filter(t => p.text.toLowerCase().includes(t)).length })).filter(x => x.score > 0).sort((a,b) => b.score-a.score).slice(0,2).map(x => x.p);
}
