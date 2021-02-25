'use strict';

import gulp from 'gulp';
import less from 'gulp-less';
import browserify from 'browserify';
import file from 'gulp-file';
import uglify from 'gulp-uglify-es';
import cssModulesify from 'css-modulesify';
import literalify from 'literalify';
import watchify from 'watchify';
import typescript from 'typescript';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import concat from 'concat-stream';
import path from 'path';
import {fileURLToPath} from 'url';
import makePot from '@wordpress/babel-plugin-makepot'

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
    return compileJS({
        entryPoint : 'js/frontend/main.js',
        cssOutput  : 'css/frontend.css',
        jsOutputDir: 'js/frontend/',
    });
}

function compileJS(options = {}) {
    const defs = {
        entryPoint : 'js/backend/main.js',
        cssOutput  : 'css/backend.css',
        jsFilename : 'tbk.js',
        jsOutputDir: 'js/backend/',
        debug      : true,
        ...options
    }

    const write = function (filepath) {
        return concat(function (content) {
            const bun = file(path.basename(filepath), content, {src: true})
            if (!defs.debug) {
                bun.pipe(uglify({
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

    b = watchify(b);
    b.on('update', bundle);

    return bundle();

}

const build = gulp.series(cssifyJSXcomponents, compileJS);
const buildFrontend = gulp.series(cssifyJSXcomponentsFrontend, compileJSfrontend);

export {build as build};
export {buildFrontend as buildFrontend};