//@flow

const PaperframeCommon = require('./Common');
const pth = require('path');

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

    _require(pkg: string): Object|null {
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

    _fixEsModules(path: string, extension: Object): Function {
        const keys: Array<string> = Object.keys(extension);
        if(keys.length === PaperframeCommon.ONE) {
            const onlyKey: string = keys[PaperframeCommon.ZERO];
            const basename: string = pth.basename(path);

            if(onlyKey.toLowerCase().startsWith(basename.toLowerCase())) {
                this.logger.trace('_fixEsModules: Fixing %s by loading only %s.', basename, onlyKey);
                return extension[onlyKey];
            }
        }

        return extension;
    }

    loadExtension(path: string, module: string): ?Function {
        let extension: Object|null = this._require(path);

        if(extension !== null) {
            return this._fixEsModules(path, extension);
        }

        return this._require(module);
    }

    loadExtensionFallback(path: string, fallbackPath: string, module: string): ?Function {
        let extension = this._require(path);

        if(extension !== null) {
            return this._fixEsModules(path, extension);
        }

        if(extension === null) {
            extension = this._require(module);
        }

        if(extension === null) {
            extension = this._require(fallbackPath);

            if(extension !== null) {
                return this._fixEsModules(path, extension);
            }
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

        // eslint-disable-next-line no-undefined
        return undefined;
    }
};
