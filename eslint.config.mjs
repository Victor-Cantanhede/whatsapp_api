// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
	{
		ignores: ['eslint.config.mjs', 'prisma/**'],
	},

	// Regras essenciais do JS
	eslint.configs.recommended,

	// Regras essenciais do TypeScript (SEM rigor extremo)
	...tseslint.configs.recommended,

	// Prettier obrigatório (formatação vira erro)
	prettier,

	{
		languageOptions: {
			globals: {
				...globals.node,
			},
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},

	// Suas regras essenciais
	{
		rules: {
			// Permite usar "any"
			'@typescript-eslint/no-explicit-any': 'off',

			// Apenas avisos para coisas mais chatas
			'@typescript-eslint/no-floating-promises': 'warn',
			'@typescript-eslint/no-unused-vars': 'warn',

			// Prettier continua estrito
			'prettier/prettier': ['error', { endOfLine: 'auto' }],
		},
	},
];
