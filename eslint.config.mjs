import nextConfig from 'eslint-config-next/core-web-vitals'
import nextTypeScriptConfig from 'eslint-config-next/typescript'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

const eslintConfig = [
  ...nextConfig,
  ...nextTypeScriptConfig,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      '.omc/**',
      '.opencode/**',
      '.serena/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
  eslintConfigPrettier,
]

export default eslintConfig
