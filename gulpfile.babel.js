'use strict';

import gulp from 'gulp';
import less from 'gulp-less';
import browserify from 'browserify';
import file from 'gulp-file';
import terser from 'gulp-terser';
import cssModulesify from 'css-modulesify';
import literalify from 'literalify';
import watchify from 'watchify';
import concat from 'concat-stream';
import path from 'path';
import zip from 'gulp-zip';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXTERNAL = ['react', 'react-dom'];

const dir = {
    src  : 'src/',
    build: ''
};

function cssifyJSXcomponents(options = {}) {
    const defs = {
        dir: 'js/backend/jsx/',
        ...options
    }
    return gulp.src(dir.src + defs.dir + '**/*.less')
        .pipe(less({
            paths: [dir.src + defs.dir]
        }))
        .pipe(gulp.dest(dir.src + defs.dir))
        ;
}

function cssifyJSXcomponentsFrontend() {
    return cssifyJSXcomponents({
        dir: 'js/frontend/jsx/',
    });
}

function compileJSfrontend() {
    process.env.BABEL_ENV = 'frontend';
    return compileJS({
        entryPoint : 'js/frontend/main.js',
        cssOutput  : 'css/frontend.css',
        jsOutputDir: 'js/frontend/',
    });
}

function buildProductionFrontend() {
    process.env.BABEL_ENV = 'frontend';
    return compileJS({
        entryPoint : 'js/frontend/main.js',
        cssOutput  : 'css/frontend.css',
        jsOutputDir: 'js/frontend/',
        production : true
    });
}

function buildProductionBackend() {
    return compileJS({
        production: true
    });
}

function zippy() {
    return gulp.src([
            '**',
            '!tsconfig.json',
            '!README.md',
            '!gulpfile.babel.js',
            '!babel.config.cjs',
            '!.gitignore',
            '!.idea/**',
            '!.git/**',
            '!src/',
            '!node_modules/**',
            '!package.json',
            '!package-lock.json',
        ]
    )
        .pipe(zip('the-booking.zip'))
        .pipe(gulp.dest('../'))
}

function compileJS(options = {}) {
    if (process.env.BABEL_ENV !== 'frontend') {
        process.env.BABEL_ENV = 'backend';
    }
    const defs = {
        entryPoint : 'js/backend/main.js',
        cssOutput  : 'css/backend.css',
        jsFilename : 'tbk.js',
        jsOutputDir: 'js/backend/',
        debug      : !options.production,
        production : false,
        ...options
    }

    const write = function (filepath) {
        return concat((content) => {
            const bun = file(path.basename(filepath), content, {src: true})
            if (!defs.debug) {
                bun.pipe(terser({
                    compress: {
                        pure_funcs: ['console.info', 'console.debug', 'console.warn', 'console.log']
                    }
                }));
            }
            return bun.pipe(gulp.dest(dir.build + defs.jsOutputDir));
        })
    }

    let b = browserify({
        entries   : dir.src + defs.entryPoint,
        debug     : defs.debug,
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        external  : EXTERNAL
    });

    b
        .transform('envify', {
            global  : true,
            _       : 'purge',
            NODE_ENV: defs.debug ? 'development' : 'production',
        })
        .plugin('tsify')
        .transform('babelify',
            {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            }
        )
    ;

    if (!defs.debug) {
        b.plugin('common-shakeify');
    }

    b.plugin(cssModulesify, {
        rootDir           : __dirname,
        output            : dir.build + defs.cssOutput,
        generateScopedName: function (name, filename, css) {
            if (filename.endsWith('theme.css')) return name;
            return 'tbk' + cssModulesify.generateShortName(name, filename, css);
        }
    });

    b.transform(
        literalify.configure({
            'react'    : 'window.React',
            'react-dom': 'window.ReactDOM',
        }),
        {global: true}
    );

    if (!defs.debug) {
        b.plugin('browser-pack-flat/plugin');
    }

    const bundle = function () {
        const bundled = b.bundle()
            .on('error', console.error)
            .pipe(write(defs.jsFilename));
        return bundled;
    }

    if (!defs.production) {
        b = watchify(b);
        b.on('update', bundle);
    }

    return bundle();

}

const build = gulp.series(cssifyJSXcomponents, compileJS);
const buildFrontend = gulp.series(cssifyJSXcomponentsFrontend, compileJSfrontend);

const buildProduction = gulp.series(cssifyJSXcomponents, buildProductionBackend, cssifyJSXcomponentsFrontend, buildProductionFrontend, zippy);
const zipPlugin = gulp.series(zippy);

export {build as build};
export {buildFrontend as buildFrontend};
export {buildProduction as buildProduction}
export {zipPlugin as zipPlugin}
