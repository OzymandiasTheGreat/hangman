import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy-glob';
import progress from 'rollup-plugin-progress';
import filesize from 'rollup-plugin-filesize';


import postcssPresetEnv from 'postcss-preset-env';
import responsiveType from 'postcss-responsive-type';


export default {
	input: 'src/main.js',
	output: {
		dir: 'dist/www/assets',
		format: 'iife',
		sourcemap: true,
	},
	plugins: [
		resolve({
			mainFields: ['browser', 'module', 'main'],
			preferBuiltins: true,
		}),
		commonjs({
			include: ['node_modules/**'],
			sourceMap: true,
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
			compress: false,
			mangle: false,
			sourcemap: true,
		}),
		postcss({
			plugins: [
				postcssPresetEnv(),
				responsiveType(),
			],
			extract: true,
			minimize: true,
			sourceMap: true,
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
			{
				files: 'node_modules/material-design-icons-iconfont/dist/fonts/**',
				dest: 'dist/www/assets/webfonts'
			},
		]),
		progress(),
		filesize(),
	],
};
