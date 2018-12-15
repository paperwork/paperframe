//@flow

const PaperframeCommon = require('./Common');

module.exports = class Base {
    _server:                    Function
    _logger:                    Function

    set server(server: Function) {
        this._server = server;
    }

    get server(): Function {
        return this._server;
    }

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
            if(err.code === 'MODULE_NOT_FOUND') {
                this.logger.debug('Router: %s not found.', pkg);
            } else {
                this.logger.error('Router: %s could not be loaded:', pkg);
                this.logger.error(err);
            }

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

    loadExtensionFallback(path: string, fallbackPath: string, module: string): ?Function {
        let extension = this._require(path);

        if(extension === null) {
            extension = this._require(module);
        }

        if(extension === null) {
            extension = this._require(fallbackPath);
        }

        return extension;
    }

    hasEnv(name: string): boolean {
        if(typeof process.env[name] === 'undefined'
        || process.env[name] === null
        || process.env[name].length === PaperframeCommon.EMPTY) {
            return false;
        }

        return true;
    }

    getEnv(name: string): any {
        if(this.hasEnv(name) === true) {
            return process.env[name];
        }

        return undefined;
    }
};
