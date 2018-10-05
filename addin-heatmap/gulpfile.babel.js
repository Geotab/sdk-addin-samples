// generated on 2018-01-16 using generator-addin 1.0.0
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import del from 'del';
import fs from 'fs';
import url from 'url';
import {
  stream as wiredep
} from 'wiredep';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('styles', () => {
  return gulp.src('app/styles/*.css')
    .pipe($.sourcemaps.init())
    .pipe($.autoprefixer({
      browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']
    }))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe(reload({
      stream: true
    }));
});

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe(reload({
        stream: true,
        once: true
      }))
      .pipe($.eslint(options))
      .pipe($.eslint.format())
      .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
  };
}

const testLintOptions = {
  env: {
    mocha: true
  }
};

gulp.task('lint', lint('app/scripts/*.js'));
gulp.task('lint:test', lint('test/spec/**/*.js', testLintOptions));

gulp.task('json', () => {
  return gulp.src('app/config.json')
    .pipe($.jsonEditor(json => {
      var options = json.dev;
      var distHost = options.dist.host;
      for (let i = 0; i < json.items.length; i++) {
        let item = json.items[i];
        if (Boolean(item.url)) {
          item.url = distHost + item.url;
        }
        if (Boolean(item.click)) {
          item.click = distHost + item.click;
        }
        if (Boolean(item.icon) && item.icon.indexOf('data:image') === -1) {
          item.icon = distHost + item.icon;
        }
      }
      // remove dev options
      delete json.dev;
      return json; // must return JSON object.
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('html', ['styles', 'scripts'], () => {
  var options = JSON.parse(fs.readFileSync('./app/config.json')).dev;
  
  return gulp.src('app/*.html')
    .pipe($.useref({
      searchPath: ['.tmp', 'app', '.']
    }))
  
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.cssSandbox('#' + options.root)))
    .pipe($.if('*.css', $.cssnano()))
    // convert relative urls to absolute
    .pipe($.if('*.html', $.cdnizer({
      defaultCDNBase: options.dist.host,
      files: ['**/*.{gif,png,jpg,jpeg,svg,js,css}']
    })))
    .pipe($.if('*.html', $.htmlmin({
      collapseWhitespace: true
    })))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{
        cleanupIDs: false
      }]
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}')
      .concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*.*',
    '!app/*.html',
    '!app/*.json'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

let mockAddinHost = sourceDir => {
  return (req, res, next) => {
    var body = '<body>';
    var script = '<head';
    var parsed = url.parse(req.url);
    var pos;
    var htmlSource;
    var config = JSON.parse(fs.readFileSync('./app/config.json'));
    var isDriveAddin = config.items.some(function (item) {
      return item.path && item.path.indexOf('DriveAppLink') > -1;
    });
    var isButton = config.items.some(function (item) {
      return Boolean(item.page);
    });

    if (parsed.pathname === '/' || parsed.pathname.indexOf(config.dev.root + '.html') > -1) {
      if (isButton) {
        htmlSource = fs.readFileSync('.dev/button.html', 'utf8')
          .replace('{click}', config.items[0].click || '')
          .replace('{icon}', `style="background-image: url(${config.items[0].icon})"` || '');
      } else {
        htmlSource = fs.readFileSync(parsed.pathname === '/' ? `${sourceDir}/${config.dev.root}.html` : parsed.pathname, 'utf8');
      }

      pos = htmlSource.indexOf(script);
      if (pos > -1) {
        htmlSource = htmlSource.substring(0, pos) + `<script>window.geotab = {addin: {}, customButtons: {}, isDriveAddin: ${isDriveAddin}};</script>` + htmlSource.substring(pos);
      }

      pos = htmlSource.indexOf(body);
      if (pos > -1) {
        htmlSource = htmlSource.substring(0, pos + body.length) + fs.readFileSync('.dev/login.html', 'utf8') + htmlSource.substring(pos + body.length);
      }

      res.end(htmlSource);
    } else {
      next();
    }
  };
};

gulp.task('serve', ['styles', 'scripts', 'fonts'], () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components',
        '/.dev': '.dev'
      },
      middleware: mockAddinHost('app')
    }
  });

  gulp.watch([
    'app/*.html',
    'app/images/**/*',
    '.tmp/fonts/**/*',
    'app/*.json'
  ]).on('change', reload);

  gulp.watch('app/styles/**/*.css', ['styles']);
  gulp.watch('app/scripts/**/*.js', ['scripts']);
  gulp.watch('app/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:dist', () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist'],
      routes: {
        '/.dev': '.dev'
      },
      middleware: mockAddinHost('dist')
    }
  });
});

gulp.task('test', ['styles', 'scripts', 'fonts'], () => {
  browserSync({
    open: false,
    notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components',
        '/.dev': '.dev'
      },
      middleware: mockAddinHost('app')
    }
  });
  return gulp
    .src('test/**/*.js', {
      read: false
    })
    .pipe($.mocha({
      reporter: 'nyan',
      timeout: 10000
    }))
    .on('error', function () {
      browserSync.exit(1);
      process.exit(1);
    })
    .on('end', function () {
      browserSync.exit();
      process.exit();
    });
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/*.html')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'json', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({
    title: 'build',
    gzip: true
  }));
});

gulp.task('default', ['clean'], () => {
  gulp.start('build');
});
