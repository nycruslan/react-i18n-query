import { useEffect, useState, useCallback } from 'react';
import type { i18n } from 'i18next';

/**
 * Default utility function to get the value of a cookie by name.
 * Can be overridden by passing a custom getter function.
 *
 * @param {string} name - The name of the cookie to retrieve.
 * @returns {string | null} - The cookie value or null if not found.
 */
const defaultGetCookieValue = (name: string): string | null => {
  const cookies = document.cookie
    .split(';')
    .find((row) => row.startsWith(`${name}=`));
  return cookies ? decodeURIComponent(cookies.split('=')[1]) : null;
};

interface UseLanguageSyncOptions {
  cookieKey?: string;
  autoChange?: boolean; // Whether to automatically change the language
  getCookieValue?: (name: string) => string | null; // Custom function to get the cookie value
  onError?: (error: Error) => void; // Optional error handler
}

/**
 * Custom hook to synchronize i18n language based on cookie value or custom getter function.
 * Ensures that language is synced immediately on the first render.
 *
 * @param {i18n} i18nInstance - The i18n instance.
 * @param {UseLanguageSyncOptions} options - Options to configure the behavior.
 */
export const useLanguageSync = (
  i18nInstance: i18n,
  {
    cookieKey = 'i18next',
    autoChange = true,
    getCookieValue = defaultGetCookieValue, // Default to the built-in cookie getter
    onError,
  }: UseLanguageSyncOptions = {}
) => {
  const [currentLang, setCurrentLang] = useState<string>(() => {
    const cookieLanguage = getCookieValue(cookieKey);

    if (
      cookieLanguage &&
      i18nInstance.language !== cookieLanguage &&
      autoChange
    ) {
      try {
        i18nInstance.changeLanguage(cookieLanguage);
        return cookieLanguage;
      } catch (error) {
        if (onError) {
          onError(
            new Error(`Failed to sync language: ${(error as Error).message}`)
          );
        }
      }
    }
    return i18nInstance.language;
  });

  // Memoize the getCookieValue to avoid function re-creation on every render
  const memoizedGetCookieValue = useCallback(
    (name: string) => getCookieValue(name),
    [getCookieValue]
  );

  useEffect(() => {
    const cookieLanguage = memoizedGetCookieValue(cookieKey);

    // Immediately change the language if necessary
    if (
      cookieLanguage &&
      i18nInstance.language !== cookieLanguage &&
      autoChange
    ) {
      try {
        i18nInstance
          .changeLanguage(cookieLanguage)
          .then(() => {
            setCurrentLang(cookieLanguage);
          })
          .catch((error) => {
            if (onError) {
              onError(
                new Error(
                  `Failed to sync language: ${(error as Error).message}`
                )
              );
            }
          });
      } catch (error) {
        if (onError) {
          onError(
            new Error(`Failed to sync language: ${(error as Error).message}`)
          );
        }
      }
    } else if (cookieLanguage) {
      setCurrentLang(cookieLanguage);
    }
  }, [i18nInstance, cookieKey, memoizedGetCookieValue, autoChange, onError]);

  return currentLang;
};
