function GenerateJsonPlugin(filename, gernerateFun, targetPath, replacer, space) {
    Object.assign(this, {
        filename,
        gernerateFun,
        targetPath,
        replacer,
        space,
        watchList : []
    });
}

GenerateJsonPlugin.prototype.apply = function apply(compiler) {
    var watchList = [];
    compiler.plugin('emit', (compilation, done) => {
        console.log('\n GenerateJsonPlugin emit event trigger.');
        var obj = this.gernerateFun(this.targetPath); //TODO: It need to optimize.
        this.watchList = watchList = obj.watchList || [this.targetPath];
        const json = JSON.stringify(obj.json, this.replacer, this.space);
        compilation.assets[this.filename] = {
            source: () => json,
            size: () => json.length,
        };
        done();
    });
    compiler.plugin('after-emit', function(compilation, callback) {
        console.log('\n GenerateJsonPlugin after-emit event trigger.');
        compilation.fileDependencies = compilation.fileDependencies.concat(watchList); //路径必须是正确的绝对路径
        callback();
    });
};

module.exports = GenerateJsonPlugin;
