import Anthropic from '@anthropic-ai/sdk';

let _client;
function getClient() {
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}

const SYSTEM_PROMPT = `You analyze voice note transcripts from elderly parents sent to their family.

Return ONLY valid JSON with these fields:
- "summary": 1-2 sentence plain-language summary of what the parent said
- "category": exactly one of: "health", "daily_life", "family", "request", "memory", "general"
- "urgency": exactly one of: "normal", "important", "urgent"

Rules:
- "urgent" = mentions pain, emergency, fall, medication problem, or asks for immediate help
- "important" = mentions doctor appointments, feeling unwell, needs something soon
- "normal" = everything else
- Keep the summary warm and faithful to what was said
- Do not add information not in the transcript
- If the transcript is empty or unintelligible, use category "general" and urgency "normal"`;

/**
 * Summarize and categorize a voice note transcript.
 */
export async function summarize(transcript) {
  if (!transcript || transcript.trim().length === 0) {
    return {
      summary: 'Voice note was empty or could not be understood.',
      category: 'general',
      urgency: 'normal',
    };
  }

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: transcript },
    ],
  });

  const text = message.content[0].text.trim();

  try {
    const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);

    return {
      summary: result.summary || 'Could not generate summary.',
      category: ['health', 'daily_life', 'family', 'request', 'memory', 'general'].includes(result.category)
        ? result.category : 'general',
      urgency: ['normal', 'important', 'urgent'].includes(result.urgency)
        ? result.urgency : 'normal',
    };
  } catch (err) {
    console.error('[Summarizer] Failed to parse Claude response:', text);
    return {
      summary: text.slice(0, 200),
      category: 'general',
      urgency: 'normal',
    };
  }
}
