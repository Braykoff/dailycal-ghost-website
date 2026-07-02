import * as fs from 'fs';
import gulp from 'gulp';
import postcss from 'gulp-postcss';
import zip from 'gulp-zip';
import concat from 'gulp-concat';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import jshint from 'gulp-jshint';
import rtlcss from 'gulp-rtlcss';
import replace from 'gulp-replace';
import cleanCSS from 'gulp-clean-css';
import autoprefixer from 'autoprefixer';
import * as sass from 'sass';
import gulpSass from 'gulp-sass';

const sassCompiler = gulpSass(sass);

// SASS Task
function sassTask(done) {
  return gulp.src('./assets/sass/*.scss')
    .pipe(sassCompiler().on('error', sassCompiler.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(rename({suffix: '-min'}))
    .pipe(cleanCSS())
    .pipe(gulp.dest('./assets/css'))
    .pipe(rtlcss())
    .pipe(rename({ suffix: '-rtl' }))
    .pipe(gulp.dest('./assets/css'));
}

// Inline CSS Task
function inlineCSSTask(done) {
  return gulp.src(['partials/css/style.hbs'])
    .pipe(replace('@@compiled_css', fs.readFileSync('assets/css/style-min.css', 'utf8')))
    .pipe(gulp.dest('partials/css/dist'));
}

// Inline CSS RTL Task
function inlineCSSRTLTask(done) {
  return gulp.src(['partials/css/style-rtl.hbs'])
    .pipe(replace('@@compiled_css_rtl', fs.readFileSync('assets/css/style-min-rtl.css', 'utf8')))
    .pipe(gulp.dest('partials/css/dist'));
}

// JavaScript Task
function jsTask(done) {
  return gulp.src([
    './bower_components/jquery/dist/jquery.js',
    './bower_components/fitvids/jquery.fitvids.js',
    './node_modules/tocbot/dist/tocbot.min.js',
    './node_modules/evil-icons/assets/evil-icons.min.js',
    './node_modules/prismjs/prism.js',
    './node_modules/fslightbox/index.js',
    './assets/js/app.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(concat('app.js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('./assets/js'));
}

// Watch Task
function watchTask() {
  gulp.watch('assets/sass/**/*.scss', gulp.series(buildCSSTask));
  gulp.watch('./assets/js/app.js', gulp.series(jsTask));
}

// Zip Task
function zipTask() {
  return gulp.src([
    './**',
    '!node_modules/**',
    '!bower_components/**',
    '!.git/**',
    '!.DS_Store',
    '!bun.lockb',
    '!package-lock.json'
  ], { dot: true, encoding: false })
    .pipe(zip('tripoli.zip'))
    .pipe(gulp.dest('../'));
}

// Composite Tasks
const buildCSSTask = gulp.series(sassTask, inlineCSSTask, inlineCSSRTLTask);
const buildTask = gulp.series(buildCSSTask, jsTask, zipTask);
const defaultTask = gulp.series(buildTask, watchTask);

// Export Tasks
export {
  sassTask as sass,
  inlineCSSTask as inlinecss,
  inlineCSSRTLTask as inlinecss_rtl,
  jsTask as js,
  zipTask as zip,
  buildCSSTask as build_css,
  buildTask as build
};

export default defaultTask;