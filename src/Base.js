//@flow


module.exports = class Base {
    _logger:                    Function

    get logger(): Function {
        return this._logger;
    }

    set logger(logger: Function) {
        this._logger = logger;
    }

    _require(pkg: string) {
        try {
            const packageRequire = require(pkg);
            return packageRequire;
        } catch(err) {
            this.logger.debug('Router: %s not found.', pkg);
            return null;
        }
    }

    loadExtension(path: string, module: string): ?Function {
        let extension = this._require(path);

        if(extension === null) {
            extension = this._require(module);
        }

        return extension;
    }
};
