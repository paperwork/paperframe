const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const rimraf = require('rimraf');
const nodemon = require('gulp-nodemon');
const gulpDocumentation = require('gulp-documentation');
const ava = require('gulp-ava');
const istanbul = require('gulp-istanbul');
const ispartaInstrumenter = require('isparta').Instrumenter;
const exec = require('child_process').exec;

const packageJson = require('./package.json');

const CONFIG = {
    js: {
        src: './src/**/*.js',
        dst: './lib'
    },
    documentation: {
        js: {
            dst: './documentation'
        }
    }
};

gulp.task('default', gulp.series(tLint, tClean, tBabel, tFlowcopy, tWatch));

gulp.task('compile', gulp.series(tLint, tClean, tBabel, tFlowcopy));

function tClean() {
    return new Promise((fulfill, reject) => {
        return rimraf(CONFIG.js.dst, (err) => {
            if(typeof err !== 'undefined' && err !== null) {
                return reject(err);
            }

            return fulfill();
        });
    });
}

/**
 * ESLint
 */
function tLint() {
    return gulp.src([CONFIG.js.src,'!node_modules/**'])
        .on('error', (err) => {
            console.log(err.toString());
            gulp.emit('end');
        })
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

/**
 * Babel
 */
function tBabel(cb) {
    return gulp.src([CONFIG.js.src])
        .pipe(sourcemaps.init())
        .pipe(babel({
            'presets': ['@babel/preset-flow'],
            'plugins': ['@babel/plugin-transform-flow-strip-types']
        }))
        .on('error', (err) => {
            console.log(err.toString());
            gulp.emit('end');
        })
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(CONFIG.js.dst))
        .on('end', cb);
}

/**
 * Flow
 */
function tFlowcopy(done) {
    return exec('npm run flow:copy', (err, stdout, stderr) => {
        done(err);
    });
}

/**
 * Tests
 */
gulp.task('test', gulp.series(tTestBefore, tTestRun));

function tTestBefore(cb) {
    return gulp.src([CONFIG.js.src, '!tests/**/*'])
        .on('error', (err) => {
            console.log(err.toString());
            gulp.emit('end');
        })
        //.pipe(istanbul({
        //    'instrumenter': ispartaInstrumenter,
        //    'includeUntested': true
        //}))
        .pipe(istanbul.hookRequire())
        .pipe(gulp.dest('tests/.tmp/'))
        .on('end', cb);
}

function tTestRun(cb) {
    process.env.NODE_BASE_PATH = process.cwd();
    process.env.LOG_LEVEL = 60;
    return gulp.src(CONFIG.tests.js.trgt)
        .pipe(ava({ 'verbose': true, 'serial': true }))
        //.pipe(istanbul.writeReports())
        .on('end', cb);
}

/**
 * Documentation
 */
gulp.task('documentation', () => {
    return gulp.src(CONFIG.js.src)
        .pipe(gulpDocumentation('md', {}, {
            'name': packageJson.name,
            'version': packageJson.version
        }))
        .pipe(gulp.dest(CONFIG.documentation.js.dst));
});

/**
 * Gulp Watch
 */
function tWatch() {
    return gulp.watch(['package.json', CONFIG.js.src], gulp.series(tLint, tBabel));
}
