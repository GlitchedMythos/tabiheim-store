import type { EntryContext } from 'react-router';
import { ServerRouter } from 'react-router';
import { renderToString } from 'react-dom/server';

/**
 * Server Entry Point for Cloudflare Pages
 *
 * This handles server-side rendering during the build process.
 * With ssr: false in config, this is only used for pre-rendering at build time.
 */
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  entryContext: EntryContext
) {
  const html = renderToString(
    <ServerRouter context={entryContext} url={request.url} />
  );

  responseHeaders.set('Content-Type', 'text/html');

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

