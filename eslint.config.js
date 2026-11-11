// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // supabase/functions are Deno edge functions (npm:/URL imports), not app code
    ignores: ['dist/*', 'supabase/functions/*'],
  },
  {
    rules: {
      // HTML-escaping rule; React Native <Text> renders apostrophes in copy as-is
      'react/no-unescaped-entities': 'off',
    },
  },
]);
