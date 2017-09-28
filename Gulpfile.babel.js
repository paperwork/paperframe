const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const rimraf = require('rimraf');
const run = require('run-sequence');
const watch = require('gulp-watch');
const jsdoc = require('gulp-jsdoc3');

const CONFIG = {
    js: {
        src: './src/**/*.js',
        dst: './lib'
    }
}

function errorHandler(err) {
    console.log(err.toString());
    this.emit('end');
}

gulp.task('default', cb => {
    run('lint', 'build', cb);
});

gulp.task('build', cb => {
    run('clean', 'babel', cb);
});

gulp.task('clean', cb => {
    rimraf(CONFIG.js.dst, cb);
});

gulp.task('lint', cb => {
    return gulp.src([CONFIG.js.src,'!node_modules/**'])
        .on('error', errorHandler)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('babel', cb => {
    gulp.src([CONFIG.js.src])
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: [],
            plugins: ['transform-flow-strip-types']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(CONFIG.js.dst))
        .on('end', cb);
});

gulp.task('doc', cb => {
    run('docs', cb);
});

gulp.task('docs', cb => {
    let jsdocjson = require('./.jsdoc.json');
    gulp.src([CONFIG.js.src], {read: false})
        .pipe(jsdoc(jsdocjson, cb));
});

gulp.task('watch', () => {
    return watch(CONFIG.js.src, (file) => {
        run(['lint'], 'build', 'docs');
    });
});
