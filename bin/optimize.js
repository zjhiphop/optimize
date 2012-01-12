//@off
var
  EOL="\n",
  FILE_ENCODING = 'utf-8',
  uglyfyJS = require("uglify-js"),
  uglifyCSS=require("uglifycss")
  _fs=require("fs"),
  jsp = uglyfyJS.parser,
  pro = uglyfyJS.uglify,
  jshint = require('../lib/linter').lint,
  csslint= require("csslint").CSSLint,
  exec=require('child_process').exec,
  _=require("underscore"),
  _util=require("./utils").util,
  CSS_LINT_FILE="csslint-result.txt",
  JS_LINT_FILE="jslint-result.txt";
//@on
var optimize = {
    concat : function(fileList, distPath,ext) {
      ext=ext||".js";
      fileList=fileList||_util.getAllFileNamesByExt(".",ext);
      distPath=distPath||"merged"+ext;
      var out = fileList.map(function(filePath) {
            return _fs.readFileSync(filePath, FILE_ENCODING);
      });
      _fs.writeFileSync(distPath, out.join(EOL), FILE_ENCODING);
      console.log(' ' + distPath + ' built.');
    }, 
    minifyCSS : function(fileList, distPath, config) {
        fileList=fileList||_util.getAllFileNamesByExt(".",".css");
        distPath=distPath||"all_css_minfied.css";
        var result = uglifyCSS.processFiles(fileList, config);
        _fs.writeFileSync(distPath, result, FILE_ENCODING);
        console.log(fileList + " is built to " + distPath);
    },
    minifyJS : function(fileList, distPath) {
        fileList=fileList||_util.getAllFileNamesByExt(".",".js");
        distPath=distPath||"all_js_minified.js";
        var ast, result="",content,error="";
        _.each(fileList, function(file) {
            content=_fs.readFileSync(file, FILE_ENCODING);
            try{
              ast = jsp.parse(content);
              ast = pro.ast_mangle(ast);
              ast = pro.ast_squeeze(ast)
            }catch(e){
               error+="Error in file: "+file+"\n"+JSON.stringify(e)+"\n";
            }
            result += pro.gen_code(ast)
        });
        _fs.writeFileSync("js_error.log", error, FILE_ENCODING);
        _fs.writeFileSync(distPath, result, FILE_ENCODING);
        console.log(' ' + distPath + ' built.');
    },
    cssLint : function(fileList) {
        if(!fileList) {
            exec("csslint --format=text . > " + CSS_LINT_FILE);
        }
        else {
            var messages, out = '', len;
            _.each(fileList, function(file) {
                messages = csslint.verify(_fs.readFileSync(file, FILE_ENCODING)).messages;
                len = messages.length;
                for(var i = len - 1; i >= 0; i--) {
                  out += messages[i].message + " (line " + messages[i].line + ", col " + messages[i].col + ")", messages[i].type;
                }
                out += (len == 0 ? "No error " : "") + "\nat file " + file + "\n\n";
            });
            _fs.writeFileSync(CSS_LINT_FILE, out, FILE_ENCODING);
        }
        console.log("please see css lint result at file " + CSS_LINT_FILE);
    },
    jsLint : function(fileList) {
        if(!fileList) {
          var files=_util.getAllFileNamesByExt(".",'.js').join(" ");
          exec("jslint "+files+" > "+JS_LINT_FILE);
        }
        else {
            var content, out="",len,pad,line;
            _.each(fileList, function(file) {
                content = _fs.readFileSync(file, FILE_ENCODING),lint=jshint(content);
                if(lint.ok){
                  out+="There is no error "
                }else{
                  len = lint.errors.length;
                  for (i = 0; i < len; i += 1) {
                      pad = "#" + String(i + 1);
                      while (pad.length < 3) {
                          pad = ' ' + pad;
                      }
                      e = lint.errors[i];
                      if (e) {
                          line = ' // Line ' + e.line + ', Pos ' + e.character;
                          out+=pad + ' ' + e.reason+"\n";
                          out+='    ' + (e.evidence || '').replace(/^\s+|\s+$/, "") +line+"\n";
                      }
                  }
                }
                out += "\nat file " + file + "\n\n";
            });
            _fs.writeFileSync(JS_LINT_FILE, out, FILE_ENCODING);
        }  
        console.log("please see js lint result at file " + CSS_LINT_FILE);
    },
    watch:function(dir,callback){
       _fs.watch(dir, function (event, filename) {
          console.log(filename+" was "+event+"ed!");
          if(callback&&typeof callback==="function"){
            callback(filename);
          }
       }); 
    }
} 
module.exports = optimize;