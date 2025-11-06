import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

/**
 * Client Entry Point
 *
 * This handles client-side hydration for the React Router Framework Mode SPA.
 * It uses HydratedRouter which is designed for framework mode applications.
 */
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});

