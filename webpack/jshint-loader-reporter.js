// jshint-loader reporter

var chalk = require('chalk');
var table = require('text-table');

module.exports = function(errors) {
    var message = '';
    var total = errors.length;

    message += table(errors.map(function (err, i) {

        if(err == null)
            return '';

        // E: Error, W: Warning, I: Info
        var isError = err.code && err.code[0] === 'E';

        var line = [
            '',
            chalk.gray('line ' + err.line),
            chalk.gray('col ' + err.character) + ':',
            isError ? chalk.red(err.reason) : chalk.magenta(err.reason),
            '\n',
            '    ',
            chalk.white.bold(err.evidence)
        ];

        // if (el.file !== prevfile) {
        //     headers[i] = el.file;
        // }

        // if (options.verbose) {
        //     line.push(chalk.gray('(' + err.code + ')'));
        // }

        // prevfile = el.file;

        return line;
    }), {
        stringLength: function (str) {
            return chalk.stripColor(str).length;
        }
    })
    .split('\n')
    // .map(function (el, i) {
    //     return headers[i] ? '\n' + chalk.underline(headers[i]) + '\n' + el : el;
    // })
    .join('\n') + '\n';

    var emitter = this.emitWarning;
    if(emitter)
        emitter("jshint results in errors\n" + message);
    else
        throw new Error("Your module system doesn't support emitWarning. Update availible? \n" + message);

};
