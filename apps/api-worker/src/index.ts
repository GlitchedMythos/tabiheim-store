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

app.get('/api/v1/inventory/:id', (c) => {
  return c.json(
    {
      message: `Hello Hono!, ${c.req.param('id')}`,
    },
    200
  );
});

export default app;
