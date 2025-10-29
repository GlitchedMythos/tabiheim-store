import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.get('/api/v1/inventory', (c) => {
  return c.json(
    {
      message: 'Hello Hono!',
    },
    200
  );
});

export default app;
