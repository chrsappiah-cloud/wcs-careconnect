// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import config from '@anythingai/app/tailwind.config'

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./node_modules/@anythingai/app/**/*.{js,ts,jsx,tsx}'
	],
	...config
}
