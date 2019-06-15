import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy-glob';
import clear from 'rollup-plugin-clear';
import progress from 'rollup-plugin-progress';
import filesize from 'rollup-plugin-filesize';


import postcssPresetEnv from 'postcss-preset-env';
import responsiveType from 'postcss-responsive-type';


export default {
	external: ['jquery', 'materialize-css'],
	input: 'src/main.js',
	output: {
		dir: 'dist/www/assets',
		format: 'iife',
		globals: {
			'jquery': '$',
			'materialize-css': 'M',
		},
		sourcemap: false,
	},
	plugins: [
		clear({targets: ['dist/']}),
		resolve({
			mainFields: ['browser', 'module', 'main'],
			preferBuiltins: true,
		}),
		commonjs({
			include: ['node_modules/**'],
			sourceMap: false,
		}),
		json(),
		babel({
			exclude: ['node_modules/**'],
			presets: [
				[
					'@babel/preset-env',
					{
						useBuiltIns: 'usage',
						corejs: 3,
					},
				],
			],
		}),
		terser({
			compress: true,
			mangle: true,
			sourcemap: false,
		}),
		postcss({
			plugins: [
				postcssPresetEnv(),
				responsiveType(),
			],
			extract: true,
			minimize: true,
			sourceMap: false,
		}),
		copy([
			{
				files: 'src/api/**',
				dest: 'dist/api'
			},
			{
				files: 'src/*.html',
				dest: 'dist/www'
			},
			{
				files: 'src/assets/*.mp3',
				dest: 'dist/www/assets'
			},
		]),
		progress(),
		filesize(),
	],
};
