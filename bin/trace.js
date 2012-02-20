//http://ariya.ofilabs.com/2012/02/tracking-javascript-execution-during-startup.html
var fs = require('fs'), esprima = require('esprima'), content;

module.exports = function(filename) {
    function customTracer(functionInfo) {
        var trace = 'TRACE.enterFunction(';
        trace += '\'' + functionInfo.name + '\', ';
        trace += '\'' + filename + '\', ';
        trace += functionInfo.loc.start.line + ', ';
        trace += 'arguments);\n';
        return trace;
    }

    content = fs.readFileSync(filename, 'utf-8');
    content = esprima.modify(content, esprima.Tracer.FunctionEntrance(customTracer));
    fs.writeFileSync(filename.replace(/\.js$/, '.traced.js'), content);
}