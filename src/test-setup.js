/**
 * Vitest setup — provides React globally for JSX transforms in component tests.
 * The automatic JSX runtime isn't applied during vitest transforms, so components
 * that use JSX without `import React` need React in the global scope.
 */
import React from 'react'
globalThis.React = React
