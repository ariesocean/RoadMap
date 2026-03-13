import { createOpencodeClient } from '@opencode-ai/sdk';

const USER_ID = process.env.USER_ID || 'test_user';
const BASE_URL = process.env.BASE_URL || 'http://localhost:1630';

const client = createOpencodeClient({
  baseUrl: `${BASE_URL}/api/opencode`,
  headers: {
    'x-user-id': USER_ID,
  },
});

async function testCreate() {
  console.log('\n=== Test: session.create ===');
  try {
    const session = await client.session.create({ body: { title: 'test-proxy' } });
    console.log('✓ Session created:', session.data.id);
    return session.data.id;
  } catch (err) {
    console.error('✗ Create failed:', err.message);
    throw err;
  }
}

async function testList() {
  console.log('\n=== Test: session.list ===');
  try {
    const sessions = await client.session.list();
    console.log('✓ Sessions listed, count:', sessions.data.sessions?.length || 0);
    return sessions.data.sessions;
  } catch (err) {
    console.error('✗ List failed:', err.message);
    throw err;
  }
}

async function testDelete(sessionId) {
  console.log('\n=== Test: session.delete ===');
  try {
    await client.session.delete({ path: { id: sessionId } });
    console.log('✓ Session deleted');
  } catch (err) {
    console.error('✗ Delete failed:', err.message);
    throw err;
  }
}

async function testPromptAsync(sessionId) {
  console.log('\n=== Test: session.promptAsync + global.event (SSE) ===');
  try {
    const promptPromise = client.session.promptAsync({
      path: { id: sessionId },
      body: { parts: [{ type: 'text', text: 'say "hello"' }] },
    });

    const eventsPromise = client.global.event();
    const events = await eventsPromise;
    const stream = events.stream;

    let done = false;
    let text = '';

    promptPromise.catch(err => {
      console.error('Prompt error:', err.message);
      done = true;
    });

    for await (const event of stream) {
      const wrapper = event.payload || event;
      const props = wrapper.properties || {};
      const eventType = wrapper.type;

      if (eventType === 'message.part.delta') {
        if (props.field === 'text' && props.delta) {
          text += props.delta;
          process.stdout.write(props.delta);
        }
      }

      if (eventType === 'session.status') {
        if (props.status?.type === 'idle') {
          done = true;
          console.log('\n✓ SSE completed');
          break;
        }
      }

      if (done) break;
    }

    if (!done) {
      console.log('\n⚠ Timed out waiting for completion');
    }

    console.log('\n✓ Prompt response received');
    return true;
  } catch (err) {
    console.error('✗ Prompt/SSE failed:', err.message);
    throw err;
  }
}

async function main() {
  console.log(`Testing SDK via proxy: ${BASE_URL}/api/opencode`);
  console.log(`User ID: ${USER_ID}`);

  try {
    await testList();
    
    const sessionId = await testCreate();
    
    await testList();
    
    await testPromptAsync(sessionId);
    
    await testDelete(sessionId);

    console.log('\n=== All tests passed! ===\n');
    process.exit(0);
  } catch (err) {
    console.error('\n=== Tests failed ===\n');
    process.exit(1);
  }
}

main();
