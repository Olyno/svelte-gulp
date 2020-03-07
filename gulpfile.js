const rollup = require('rollup');
const svelte = require('rollup-plugin-svelte');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { terser } = require('rollup-plugin-terser');

const { src, watch, series } = require('gulp');
const connect = require('gulp-connect');
const open = require('gulp-open');

const PORTS = process.env.PORTS || 3000
let production = false;

function watchFiles() {
    return startServer()
        .then(() => {
            return watch(['src/**/*.svelte'], series(buildApp, reloadServer));
        })
}

function reloadServer() {
    return src('public/**/*')
        .pipe(connect.reload())
}

function startServer() {
    return new Promise((resolve, rejects) => {
        connect.server({
            root: 'public',
            port: PORTS,
            livereload: !production
        })
        src('public/index.html')
            .pipe(open({ uri: 'http://localhost:' + PORTS }));
        resolve();
    })
}

function buildApp() {
    return rollup.rollup({
        input: 'src/main.js',
        plugins: [
            svelte({
                // enable run-time checks when not in production
                dev: !production,
                // we'll extract any component CSS out into
                // a separate file - better for performance
                css: css => {
                    css.write('public/build/bundle.css');
                }
            }),
    
            // If you have external dependencies installed from
            // npm, you'll most likely need these plugins. In
            // some cases you'll need additional configuration -
            // consult the documentation for details:
            // https://github.com/rollup/plugins/tree/master/packages/commonjs
            resolve({
                browser: true,
                dedupe: ['svelte']
            }),
            commonjs(),
    
            // If we're building for production (npm run build
            // instead of npm run dev), minify
            production && terser()
        ]
    })
        .then(bundle => {
            return bundle.write({
                sourcemap: true,
                format: 'iife',
                name: 'app',
                file: 'public/build/bundle.js'
            })
        })
}

function setupProduction() {
    return new Promise((resolve, rejects) => {
        production = true;
        resolve();
    })
}

exports.dev = series(buildApp, watchFiles);
exports.build = buildApp;
exports.start = series(setupProduction, startServer);