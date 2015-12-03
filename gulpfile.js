const path      = require("path")
    , exec      = require("child_process").exec
    , through   = require("through")

const gulp      = require("gulp")
    , gConn     = require("gulp-connect")

const paths = {
    lib: "lib/**/*",
    vendor_dist: "lib/vendor"
}

const vendor = [
    "node_modules/sinon/pkg/sinon.js",
    "node_modules/catbus/dist/catbus.js",
    "node_modules/jquery/dist/jquery.js",
    "node_modules/mocha/mocha.js",
    "node_modules/mocha/mocha.css",
    "node_modules/should/should.js"
]

const connectConf = {
    port: process.env.PORT || 3000,
    root: path.join(__dirname, "lib"),
    livereload: process.env.RELOAD === "false" ? false : true
}

/*
 *gulp.task("bark", () => { console.log(process.argv)})
 *
 *gulp.task("ship", () => {
 *    gulp.src("lib/ohmu.js").pipe(gulp.dest("dist"))
 *
 *    var bump = exec("echo nanners")
 *
 *    bump.stdout.pipe(through(function (output) {
 *        console.log(output) // maybe this
 *        this.queue(output)
 *    }))
 *    .pipe(process.stdout)
 *
 *    bump.stderr.pipe(process.stderr)
 *
 *})
 */

gulp.task("vendor", () => {
    gulp.src(vendor).pipe(gulp.dest(paths.vendor_dist))
})

gulp.task("serve", () => {
    gConn.server(connectConf)
})

gulp.task("reload", () => {
    gulp.src(paths.lib).pipe(gConn.reload())
})

gulp.task("watch", () => {
    gulp.watch(paths.lib, ["reload"])
    gulp.watch(vendor, ["vendor"])
})

gulp.task("default", ["vendor", "serve", "watch"])
