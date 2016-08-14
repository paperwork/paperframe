import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import eslint from 'gulp-eslint';
import rimraf from 'rimraf';
import run from 'run-sequence';
import watch from 'gulp-watch';
import jsdoc from 'gulp-jsdoc3';

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
            presets: ['stage-0', 'es2015-node6']
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
