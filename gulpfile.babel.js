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
import rename from 'gulp-rename';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXTERNAL = ['react', 'react-dom'];

const dir = {
    src  : 'src/',
    build: ''
};

function copyTinyCustomPlugin(options = {}) {
    const defs = {
        dir: 'src/js/backend/',
        ...options
    }
    return gulp.src([
        defs.dir + 'tinyCustomPlugin.js',
    ])
        .pipe(terser())
        .pipe(rename('plugin.min.js'))
        .pipe(gulp.dest('js/backend/tiny/plugins/tbk-hooks'))
}

function copyTiny(options = {}) {
    const defs = {
        dir: 'node_modules/tinymce/',
        ...options
    }
    return gulp.src([
        defs.dir + 'tinymce.min.js',
        defs.dir + '*icons/**/*',
        defs.dir + '*skins/**/*',
        defs.dir + '*themes/silver/theme.min.js',
        defs.dir + '*plugins/code/plugin.min.js',
        defs.dir + '*plugins/fullscreen/plugin.min.js',
        defs.dir + '*plugins/link/plugin.min.js',
        defs.dir + '*plugins/noneditable/plugin.min.js',
        defs.dir + '*plugins/preview/plugin.min.js',
        defs.dir + '*plugins/quickbars/plugin.min.js'
    ])
        .pipe(gulp.dest('js/backend/tiny/'))
}

function copyPrime(options = {}) {
    const defs = {
        dir: 'node_modules/',
        ...options
    }
    return gulp.src([
        defs.dir + 'primereact/resources/themes/saga-blue/theme.css',
        defs.dir + 'primereact/resources/primereact.min.css',
        defs.dir + 'primeflex/primeflex.min.css',
        defs.dir + 'primeicons/primeicons.css',
        defs.dir + 'primeicons/*fonts/**/*',
    ])
        .pipe(gulp.dest('css'))
}

function copyNoUiSliderJS(options = {}) {
    const defs = {
        dir: 'node_modules/nouislider/distribute/',
        ...options
    }
    return gulp.src(defs.dir + 'nouislider.min.js')
        .pipe(gulp.dest('js/backend'))
}

function copyNoUiSliderCSS(options = {}) {
    const defs = {
        dir: 'node_modules/nouislider/distribute/',
        ...options
    }
    return gulp.src(defs.dir + 'nouislider.min.css')
        .pipe(gulp.dest('css'))
}

function copyPhoneInputCSS(options = {}) {
    const defs = {
        dir: 'node_modules/react-phone-input-2/lib/',
        ...options
    }
    return gulp.src(defs.dir + 'style.css')
        .pipe(rename('phoneInputStyle.css'))
        .pipe(gulp.dest('css'))
}

function copyClockCSS(options = {}) {
    const defs = {
        dir: 'node_modules/react-clock/dist/',
        ...options
    }
    return gulp.src(defs.dir + 'Clock.css')
        .pipe(rename('clock.css'))
        .pipe(gulp.dest('css'))
}

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
            '!src/**',
            '!node_modules/**',
            '!package.json',
            '!package-lock.json',
            '!composer.json',
            '!composer.lock',
            '!vendor/google/apiclient-services/tests/**',
            '!vendor/google/apiclient-services/generator/**',
            '!vendor/google/apiclient-services/composer.json',
            '!vendor/google/apiclient-services/phpunit.xml',
            '!vendor/google/apiclient-services/synth.py',
            '!vendor/google/apiclient-services/synth.metadata',
        ]
    )
        .pipe(zip('thebooking.zip'))
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

const build = gulp.series(
    copyTiny,
    copyTinyCustomPlugin,
    copyNoUiSliderCSS,
    copyNoUiSliderJS,
    copyPhoneInputCSS,
    copyClockCSS,
    copyPrime,
    cssifyJSXcomponents,
    compileJS
);
const buildFrontend = gulp.series(cssifyJSXcomponentsFrontend, compileJSfrontend);

const buildProduction = gulp.series(
    copyTiny,
    copyTinyCustomPlugin,
    copyNoUiSliderCSS,
    copyNoUiSliderJS,
    copyPhoneInputCSS,
    copyClockCSS,
    copyPrime,
    cssifyJSXcomponents,
    buildProductionBackend,
    cssifyJSXcomponentsFrontend,
    buildProductionFrontend,
    zippy
);

const zipPlugin = gulp.series(zippy);

export {build as build};
export {buildFrontend as buildFrontend};
export {buildProduction as buildProduction}
export {zipPlugin as zipPlugin}
