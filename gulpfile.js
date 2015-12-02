const path      = require("path")

const gulp      = require("gulp")
    , gConn     = require("gulp-connect")

const paths = {
    lib: "lib/**/*"
}

const connectConf = {
    port: process.env.PORT || 3000,
    root: path.join(__dirname, "lib"),
    livereload: process.env.RELOAD === "false" ? false : true
}


gulp.task("serve", () => {
    gConn.server(connectConf)
})

gulp.task("reload", () => {
    gulp.src(paths.lib).pipe(gConn.reload())
})

gulp.task("watch", () => {
    gulp.watch(paths.lib, ["reload"])
})

gulp.task("default", ["serve", "watch"])
