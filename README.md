# Quick Start: Using `NamespaceQueryHttpBackend` and `createNsWithQuery`

This guide walks you through setting up and using the `NamespaceQueryHttpBackend` plugin with the `createNsWithQuery` utility for managing dynamic query parameters in `i18next` namespaces.

## 1. Installation

To get started, install the required dependencies:

```bash
npm install i18next react-i18next i18next-http-backend react-i18n-query
```

## 2. Overview

- **`NamespaceQueryHttpBackend`**: Extends `i18next-http-backend` to allow dynamic query parameters in namespaces using a `$` separator.
- **`createNsWithQuery`**: Utility to process namespaces and attach query parameters dynamically.

## 3. Setting Up `i18next` with `NamespaceQueryHttpBackend`

Initialize an `i18next` instance using `NamespaceQueryHttpBackend`:

```typescript
import { createInstance } from 'i18next';
import { NamespaceQueryHttpBackend, createNsWithQuery } from 'react-i18n-query';

// Define a namespace with query parameters
const { ns } = createNsWithQuery({
  namespace: 'comments',
  query: {
    postId: '1',
  },
});

// Create and configure the i18next instance
export const i18n = createInstance({
  backend: {
    loadPath: 'https://jsonplaceholder.typicode.com/{{ns}}?locale={{lng}}',
    queryStringParams: {
      key: 'value', // Default query params applied to all namespaces
    },
  },
  ns,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
}).use(NamespaceQueryHttpBackend);

i18n.init();
```

### Key Points:

- **Namespace**: A combination of a base name (`comments`) and query parameters (`postId`).
- **Dynamic Parameters**: Attach additional parameters like `locale` and `key`.

## 4. Using `createNsWithQuery` for Dynamic Namespaces

`createNsWithQuery` lets you create namespaces with dynamic queries and provides functions to retrieve namespaces by ID or query parameters.

### Example Usage

```typescript
import { createNsWithQuery } from 'react-i18n-query';

// Define multiple namespaces with query parameters
const { ns, getNsById, getNs } = createNsWithQuery([
  { namespace: 'comments', query: { postId: '2' } },
  { namespace: 'comments', query: { postId: '3' } },
  { id: 'post4', namespace: 'comments', query: { postId: '4' } }, // Optional ID
  { namespace: 'comments', query: { postId: '5' } },
]);
```

### Key Points:

- **`ns`**: Array of processed namespaces with query parameters.
- **`getNsById(id)`**: Retrieve a namespace by its `id`.
- **`getNs({ namespace, query })`**: Find a namespace by matching both its name and query parameters.

## 5. Integrating with `react-i18next`

Use `useTranslation` from `react-i18next` to translate content using the processed namespaces:

```typescript
import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation(ns);

  return (
    <div>
      {/* Directly access a namespace by index */}
      <div>{t('1.body')}</div>
      {/* Access a namespace by ID */}
      <div>{t('1.body', { ns: getNsById('post4') })}</div>
      {/* Access a namespace by name and query */}
      <div>
        {t('1.body', {
          ns: getNs({ namespace: 'comments', query: { postId: '5' } }),
        })}
      </div>
    </div>
  );
}
```

### Key Points:

- **Namespace Access**: Use `ns` for array index access, `getNsById` for ID-based access, and `getNs` for dynamic access.

## 6. Wrapping Your App with `I18nextProvider`

Wrap your app in `I18nextProvider` to provide translation capabilities globally:

```typescript
import { Suspense, PropsWithChildren } from 'react';
import { I18nextProvider } from 'react-i18next';

const ContentProvider = ({ children }: PropsWithChildren) => (
  <I18nextProvider i18n={i18n} defaultNS="comments">
    <Suspense fallback={<p>Loading...</p>}>{children}</Suspense>
  </I18nextProvider>
);

export default ContentProvider;
```

### Key Points:

- **Suspense Fallback**: Displays a fallback while translations are loading.
- **Global i18n Access**: Provides the `i18next` instance throughout your app.

## 7. Full Integration Example

Here’s an example bringing everything together:

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ContentProvider from './ContentProvider';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ContentProvider>
      <App />
    </ContentProvider>
  </React.StrictMode>
);
```

## 8. Conclusion

By using `NamespaceQueryHttpBackend` and `createNsWithQuery`, you can easily integrate dynamic query parameters into your `i18next` namespaces, making your translations flexible and component-level customizable.

Enjoy using these tools to simplify your translation management in React apps!
