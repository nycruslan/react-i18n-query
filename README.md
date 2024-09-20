# Quick Start: Using `NamespaceQueryHttpBackend` and `processNamespaces`

This guide will walk you through how to quickly set up and use the `NamespaceQueryHttpBackend` plugin along with the `processNamespaces` utility function to handle dynamic query parameters in `i18next` namespaces.

## 1. Installation

To get started, you need to install the required dependencies:

```bash
npm install i18next react-i18next i18next-http-backend react-i18n-query
```

## 2. NamespaceQueryHttpBackend Overview

The `NamespaceQueryHttpBackend` plugin extends the `i18next-http-backend` to allow you to pass dynamic query parameters in the namespaces using a `$` separator.

### Example:

```text
namespace$queryParams
```

This allows you to fetch data like translations, comments, or any dynamic content based on URL parameters.

## 3. Setting Up the i18next Instance

Create an instance of `i18next` and configure it to use the `NamespaceQueryHttpBackend`:

```typescript
import { createInstance } from 'i18next';
import { NamespaceQueryHttpBackend, processNamespaces } from 'react-i18n-query';

const { ns } = processNamespaces({
  namespace: 'comments',
  query: {
    postId: '1',
  },
});

export const i18n = createInstance({
  backend: {
    loadPath: 'https://jsonplaceholder.typicode.com/{{ns}}?locale={{lng}}',
    queryStringParams: {
      key: 'value', // default query params to be assigned to all namespace
    },
  },
  ns,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
}).use(NamespaceQueryHttpBackend);

i18n.init();
```

### Explanation:

- **Namespace**: The namespace includes both the base name (`comments`) and query parameters (`postId`).
- **Dynamic Query Parameters**: You can pass additional query parameters like `locale` and `_format` to the backend.

## 4. Using the `processNamespaces` Utility

The `processNamespaces` function lets you define namespaces and attach query parameters dynamically. You can also look up namespaces by `id` or match namespaces by their name and query parameters.

### Example Usage:

```typescript
import { processNamespaces } from 'react-i18n-query';

// Define multiple namespaces with query parameters
const { ns, getNsById, getNs } = processNamespaces([
  {
    namespace: 'comments',
    query: {
      postId: '2',
    },
  },
  {
    namespace: 'comments',
    query: {
      postId: '3',
    },
  },
  {
    id: 'post4', // optional id
    namespace: 'comments',
    query: {
      postId: '4',
    },
  },
  {
    namespace: 'comments',
    query: {
      postId: '5',
    },
  },
]);
```

### Explanation:

- **`ns`**: A string or array of processed namespaces with query parameters.
- **`getNsById(id)`**: Retrieve a namespace by its `id`.
- **`getNs({ namespace, query })`**: Find a namespace by matching both `namespace` and `query`.

## 5. React Integration with `react-i18next`

Use the `useTranslation` hook from `react-i18next` to translate content based on the namespaces:

```typescript
import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation(ns); // Use the array of namespace strings

  return (
    <div>
      {/* Access by array index */}
      <div>{t('1.body')}</div>
      <br />
      <div>{t('1.body', { ns: ns[1] })}</div>
      <br />
      <div>{t('1.body', { ns: getNsById('post4') })}</div>
      <br />
      <div>
        {t('1.body', {
          ns: getNs({ namespace: 'comments', query: { postId: '5' } }),
        })}
      </div>
    </div>
  );
}
```

### Explanation:

- **Access by Array Index**: Directly use the namespace at a specific index in the `ns` array.
- **Access by ID**: Use `getNsById('post4')` to retrieve a specific namespace by ID.
- **Access by Namespace and Query**: Use `getNs({ namespace, query })` to dynamically find the namespace.

## 6. Wrapping the Application with `I18nextProvider`

Finally, wrap your application with the `I18nextProvider` to provide translation capabilities across your app:

```typescript
import { Suspense, PropsWithChildren } from 'react';
import { I18nextProvider } from 'react-i18next';

const ContentProvider = ({ children }: PropsWithChildren) => {
  return (
    <I18nextProvider i18n={i18n} defaultNS="comments">
      <Suspense fallback={<p>Loading...</p>}>{children}</Suspense>
    </I18nextProvider>
  );
};

export default ContentProvider;
```

### Explanation:

- **Suspense**: Ensures a loading fallback while translations are being loaded.
- **`I18nextProvider`**: Provides the i18n instance throughout your app, enabling translation with namespaces.

## 7. Full Example

Here’s a full example of how everything works together:

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

With `NamespaceQueryHttpBackend` and `processNamespaces`, you can easily manipulate query parameters at the component level and dynamically load translations or other data based on those parameters.

Enjoy using this powerful yet simple library to manage dynamic namespaces in your `i18next` integration!
