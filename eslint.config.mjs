// Native flat config for ESLint 9/10. `eslint-config-next/core-web-vitals`
// already bundles the Next core rules + `next/typescript`, so we consume it
// directly — the old FlatCompat wrapper breaks under ESLint 10.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import reactHooks from 'eslint-plugin-react-hooks'

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'dist/**',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
  {
    // Register the plugin in the SAME config object as the rules. The rules
    // below resolve via this explicit object rather than relying on
    // eslint-config-next's transitive registration + node_modules hoisting —
    // a fresh CI install hoists differently than an incremental local one,
    // which made ESLint report "could not find plugin react-hooks".
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // React Compiler rules (new in eslint-config-next 16) flag many legitimate
      // existing patterns (effect-driven sync, manual memoization, Date.now in a
      // memo) across money-flow code that hasn't been refactored for them. Keep
      // them visible as warnings instead of hard-blocking; address incrementally.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
]

export default eslintConfig
