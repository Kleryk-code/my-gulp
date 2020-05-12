let project__folder="dist";
let source_folder= "#src";

let fs = require('fs');

let path = {
    build: {
        html: project__folder + "/",
        css: project__folder + "/css/",
        js: project__folder + "/js/",
        img: project__folder + "/img/",
        fonts: project__folder + "/fonts/",
    },
    src: {
        html: [source_folder + "/*.html", "!" + source_folder + "/_*.html" ],
        css: source_folder + "/scss/style.scss",
        js: source_folder + "/js/script.js",
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
        fonts: source_folder + "/fonts/*.ttf",
    },
    watch: {
        html: source_folder + "/**/*.html",
        css: source_folder + "/scss/**/*.scss",
        js: source_folder + "/js/**/*.js",
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}"
    },
    clean: "./" + project__folder + "/"
}

//Переменные подключаемых плагинов
let {src, dest } = require('gulp'),
    gulp = require('gulp'),
    browsersync = require("browser-sync").create(),
    fileinclude = require("gulp-file-include"),
    del = require("del"),
    scss = require("gulp-sass"),
    autoprefixer = require("gulp-autoprefixer"),
    group_media = require("gulp-group-css-media-queries"),
    clean_css = require("gulp-clean-css"),
    rename = require("gulp-rename"),
    uglify = require("gulp-uglify-es").default,
    babel = require("gulp-babel"),
    imagemin = require("gulp-imagemin"),
    webp = require("gulp-webp"),
    webphtml = require("gulp-webp-html"),
    webpcss = require("gulp-webpcss"),
    svgSprite = require("gulp-svg-sprite"),
    ttf2woff = require("gulp-ttf2woff"),
    ttf2woff2 = require("gulp-ttf2woff2"),
    fonter = require("gulp-fonter");

//Функция синхронизации браузера
function browserSync(params) {
    browsersync.init({
        server:{
            baseDir: "./" + project__folder + "/"
        },
        port:3000,
        notify: false
    })
}

//Функция плагинов html
function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}

//Функция плагинов css
function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded"
            })
        )
        .pipe (
            group_media()
            )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(webpcss())
        .pipe(dest(path.build.css))
        .pipe(clean_css())
        .pipe(
            rename({
                extname: ".min.css"
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

//Функция плагинов js
function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(dest(path.build.js))
        .pipe(
            uglify()
        )
        .pipe(
            rename({
                extname: ".min.js"
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}


//Функция плагинов image
function images() {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 75
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 3}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())
}

//Функция плагинов шрифтов
function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts));
};


// Перевод шрифтов из формата .otf в .ttf Запускать перед запуском gulp командой "gulp otf2ttf"
gulp.task('otf2ttf', function () {
    return src([source_folder + '/fonts/*.otf'])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(source_folder + '/fonts/'));
})

//Создание спрайта svg Запускать командой "gulp svgSprite" К сожалению не работает
gulp.task('svgSprite', function () {
    return gulp.src([source_folder + '/iconsprite/*.svg'])
        .pipe(svgSprite({
            moode: {
                stack: {
                    sprite: "../icons/icons.svg", //sprite file name
                    example: true
                }
            },
        }
        ))
        .pipe(dest(path.build.img))
})


//JS-функция записи информации в fonts.scss
function fontsStyle(params) {
    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss'); 
    if (file_content == '') { 
        fs.writeFile(source_folder + '/scss/fonts.scss', '', cb); 
        return fs.readdir(path.build.fonts, function (err, items) { 
            if (items) { 
                let c_fontname; 
                for (var i = 0; i < items.length; i++) { 
                    let fontname = items[i].split('.'); 
                    fontname = fontname[0]; 
                    if (c_fontname != fontname) { 
                        fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb); 
                    } 
                    c_fontname = fontname; 
                } 
            } 
        }) 
    }    
}
    
//Функция для работы записи шрифтов из функции выше ^
function cb() {

}

function watchFiles(params) {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

//Функция очистки
function clean(params) {
    return del(path.clean);
}

//Переменные запуска
let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle);
let watch=gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;


//Создано по ролику https://www.youtube.com/watch?v=stFOy0Noahg
//Запуск командой "Gulp"
//Запуск перевода шрифтов из формата otf в ttf командой "gulp otf2ttf"
//Запуск создания svg спрайта командой "gulp svgSprite"

//При автоматическом создании font-face необходимо удалить значение веса шрифта
//из первого столбика в имени и поменять вес на подходящий в третьем столбике