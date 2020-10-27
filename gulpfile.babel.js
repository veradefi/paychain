import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import path from 'path';
import del from 'del';
import runSequence from 'run-sequence';

const plugins = gulpLoadPlugins();
const polyfill = './node_modules/gulp-babel/node_modules/babel-core/browser-polyfill.js'

const paths = {
    js: ['./**/*.js', '!dist/**', '!node_modules/**', '!coverage/**'],
    nonJs: ['./package.json', './.gitignore', './.env', './.env.sandbox'],
    tests: './server/tests/*.js',
    public: ['./server/public/**/*.html', './server/public/**/*.css'],
    json: ['./server/json/*.json']
};

// Clean up dist and coverage directory
gulp.task('clean', () =>
    del.sync(['dist/**', 'dist/.*', 'coverage/**', '!dist', '!coverage'])
);

// Copy non-js files to dist
gulp.task('copy', () =>
    gulp.src(paths.nonJs)
        .pipe(plugins.newer('dist'))
        .pipe(gulp.dest('dist'))
);

// Copy html and css files to dist/server/public
gulp.task('copy-public', () =>
    gulp.src(paths.public)
        .pipe(gulp.dest('dist/server/public'))
);

// Copy html and css files to dist/server/public
gulp.task('copy-json', () =>
    gulp.src(paths.json)
        .pipe(gulp.dest('dist/server/json'))
);

// Compile ES6 to ES5 and copy to dist
gulp.task('babel', () =>
    gulp.src([...paths.js, '!gulpfile.babel.js', polyfill], { base: '.' })
        .pipe(plugins.newer('dist'))
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.babel({}))
        .pipe(plugins.sourcemaps.write('.', {
            includeContent: false,
            sourceRoot(file) {
                return path.relative(file.path, __dirname);
            },
        }))
        .pipe(gulp.dest('dist'))
);

// Start server with restart on file changes
gulp.task('nodemon', ['copy', 'copy-public', 'copy-json', 'babel'], () =>
    plugins.nodemon({
        script: path.join('dist', 'index.js'),
        ext: 'js',
        ignore: ['node_modules/**/*.js', 'dist/**/*.js'],
        tasks: ['copy', 'copy-public', 'copy-json', 'babel'],
    })
);

// gulp serve for development
gulp.task('serve', ['clean'], () => runSequence('nodemon'));

// default task: clean dist, compile js files and copy non-js files.
gulp.task('default', ['clean'], () => {
    runSequence(
        ['copy', 'copy-public', 'copy-json', 'babel']
    );
});
