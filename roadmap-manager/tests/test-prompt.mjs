import { createOpencodeClient } from '@opencode-ai/sdk';

const client = createOpencodeClient({
  baseUrl: 'http://localhost:51000',
});

async function main() {
  console.log('Creating session...');
  const session = await client.session.create({ body: { title: 'test-prompt' } });
  console.log('Session:', session.data);

  const sessionId = session.data.id;
  console.log('\nSending prompt...');

  const promptPromise = client.session.promptAsync({
    path: { id: sessionId },
    body: { parts: [{ type: 'text', text: '当前在哪个路径下' }] },
  });

  const eventsPromise = client.global.event();

  const events = await eventsPromise;
  const stream = events.stream;

  let partTypes = new Map();

  promptPromise.catch(err => console.error('Prompt error:', err));

  for await (const event of stream) {
    const wrapper = event.payload || event;
    const props = wrapper.properties || {};
    const part = props.part || {};
    const sessionIdFromEvent = props.sessionID || wrapper.sessionID;
    const eventType = wrapper.type;

    if (sessionIdFromEvent !== sessionId) continue;

    if (eventType === 'message.part.delta') {
      if (props.field === 'text' && props.delta) {
        process.stdout.write(props.delta);
      }
    }

    if (eventType === 'session.status') {
      if (props.status?.type === 'idle') {
        console.log('\n\nDone!');
        process.exit(0);
      }
    }
  }
}

main().catch(console.error);
