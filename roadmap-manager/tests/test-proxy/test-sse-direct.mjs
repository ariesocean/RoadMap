import { createOpencodeClient } from '@opencode-ai/sdk';

const client = createOpencodeClient({
  baseUrl: 'http://localhost:51000',
});

async function testSSE() {
  console.log('Testing SSE directly to OpenCode server...');
  
  try {
    const events = await client.global.event();
    console.log('Events response:', events);
    
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
