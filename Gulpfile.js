'use strict';

const gulp = require('gulp');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const ava = require('gulp-ava');
const documentation = require('gulp-documentation');
const exec = require('child_process').exec;
const rimraf = require('rimraf');

const packageJson = require('./package.json');

const CONFIG = {
    'js': {
        'src': './src/**/*.js',
        'dst': './lib'
    },
    'test': {
        'js': {
            'trgt': './test/**/*.js'
        }
    },
    'documentation': {
        'js': {
            'dst': './documentation'
        }
    }
};

function clean(cb) {
    return rimraf(CONFIG.js.dst, (err) => {
        cb(err);
    });
}

function flowcopy(cb) {
    return exec('npm run flow:copy', (err) => {
        cb(err);
    });
}

function transpile(cb) {
    return gulp.src([CONFIG.js.src])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
        .pipe(babel())
        .pipe(gulp.dest(CONFIG.js.dst))
        .on('end', cb);
}

function test(cb) {
    return gulp.src([CONFIG.test.js.trgt])
        .pipe(ava({
            'verbose': false,
            'silent': false,
            'nyc': false
        }))
        .on('end', cb);
}

function doc(cb) {
    return gulp.src(CONFIG.js.src)
        .pipe(documentation('md', {}, {
            'name': packageJson.name,
            'version': packageJson.version
        }))
        .pipe(gulp.dest(CONFIG.documentation.js.dst))
        .on('end', cb);
}

gulp.task('compile', gulp.series(clean, transpile, flowcopy));
gulp.task('develop', () => gulp.watch(['package.json', CONFIG.js.src], gulp.series(clean, transpile, flowcopy)));
gulp.task('test', test);
gulp.task('documentation', doc);
