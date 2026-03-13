import { createOpencodeClient } from '@opencode-ai/sdk';

const USER_ID = process.env.USER_ID || 'harvey_20260312';
const BASE_URL = process.env.BASE_URL || 'http://localhost:1630';

const client = createOpencodeClient({
  baseUrl: `${BASE_URL}/api/opencode`,
  headers: {
    'x-user-id': USER_ID,
  },
});

async function testSSE() {
  console.log('Testing SSE...');
  
  try {
    const events = await client.global.event();
    console.log('Events response:', events);
    console.log('Stream type:', typeof events.stream);
    
    let count = 0;
    for await (const event of events.stream) {
      console.log('Event:', JSON.stringify(event));
      count++;
      if (count > 5) break;
    }
    console.log('Received', count, 'events');
  } catch (err) {
    console.error('Error:', err);
  }
}

testSSE();
