import { join } from 'path';


import multiEntry from 'rollup-plugin-multi-entry';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-cpy';
import progress from 'rollup-plugin-progress';
import filesize from 'rollup-plugin-filesize';
import notify from 'rollup-plugin-notify';
import browsersync from 'rollup-plugin-browsersync';


import postcssPresetEnv from 'postcss-preset-env';
import responsiveType from 'postcss-responsive-type';


// eslint-disable-next-line no-process-env,no-undef
const IS_DEV = process.env.NODE_ENV === 'development';
const dest = (...args) => join('./dist/', ...args);
const src = (...args) => join('./src/', ...args);


export default {
	external: ['jquery', 'materialize-css'],
	input: [src('index.js'), src('index.sass')],
	output: {
		file: dest('www', 'assets', 'index.js'),
		format: 'iife',
		globals: {
			'jquery': '$',
			'materialize-css': 'M',
		},
		sourcemap: IS_DEV,
	},
	watch: {
		include: src('**'),
		exclude: src('api', '**'),
	},
	plugins: [
		multiEntry({
			exports: false,
		}),
		resolve({
			mainFields: ['browser', 'module', 'main'],
			preferBuiltins: true,
		}),
		commonjs({
			include: ['node_modules/**'],
			sourceMap: IS_DEV,
		}),
		buble({
			exclude: [
				'**/*!(.js)',
				'node_modules/**',
			],
			transforms: {
				dangerousForOf: true,
			},
		}),
		terser({
			compress: true,
			mangle: !IS_DEV,
			sourcemap: IS_DEV,
		}),
		postcss({
			plugins: [
				postcssPresetEnv(),
				responsiveType(),
			],
			extract: true,
			minimize: true,
			sourceMap: IS_DEV,
		}),
		copy([
			{
				files: src('index.html'),
				dest: dest('www'),
			},
			{
				files: src('assets', '*.mp3'),
				dest: dest('www', 'assets'),
			},
			{
				files: 'requirements.txt',
				dest: dest(),
			},
			{
				files: 'util/*',
				dest: dest('api', 'util'),
			},
		]),
		progress(),
		filesize(),
		notify(),
		IS_DEV && browsersync({
			watch: true,
			watchEvents: ['change', 'add', 'addDir'],
			ignore: ['**/*.mp3'],
			proxy: 'localhost:5000',
			serveStatic: [
				{
					route: '/',
					dir: dest(),
				},
				{
					route: '/assets',
					dir: dest('assets'),
				},
			],
			serveStaticOptions: {
				index: 'index.html',
			},
			open: false,
			ui: false,
			online: true,
			logLevel: 'warn',
		}),
	],
};
