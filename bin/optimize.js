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
  JS_LINT_FILE="jslint-result.txt",
  cssImportRegExp=/\@import\s+(url\()?\s*([^);]+)\s*(\))?([\w, ]*)(;)?/g,
  cssUrlRegExp = /\url\(\s*([^\)]+)\s*\)?/g;

  
//@on
var optimize = {
    concat : function(fileList,distPath,ext,ctx) {
      ext=ext||".js";
      fileList=fileList||_util.getAllFileNamesByExt(".",ext);
      distPath=distPath||"merged"+ext;
      var out = fileList.map(function(filePath) {
            var content=_fs.readFileSync(filePath, FILE_ENCODING);
			if(~ext.indexOf("css")&&ctx&&ctx.flatCSS){
			  	content=optimize.flattenCss(filePath,content);
			}
			return content;
      });
      _fs.writeFileSync(distPath, out.join(EOL), FILE_ENCODING);
      console.log(' ' + distPath + ' built.');
    }, 
	/**
	 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
	 * Available via the MIT or new BSD license.
	 * see: http://github.com/jrburke/requirejs for details
	 */
	flattenCss:function(fileName, fileContents, cssImportIgnore) {
		if(!fileContents) return ;
        //Find the last slash in the name.
        fileName =fileName.replace(/\\/g, "/");
        var endIndex = fileName.lastIndexOf("/"),
            //Make a file path based on the last slash.
            //If no slash, so must be just a file name. Use empty string then.
            filePath = (endIndex !== -1) ? fileName.substring(0, endIndex + 1) : "";
		function cleanCssUrlQuotes(url){
		   url=url.replace(/\s+$/,"");
		   var a=url.charAt(0);
		   if(a==="'"||a==="\""){
		     url=url.substring(1,url.lastIndexOf("'")||url.lastIndexOf("\""));
		   }
		   return url;
		}
        //Make sure we have a delimited ignore list to make matching faster
        if (cssImportIgnore && cssImportIgnore.charAt(cssImportIgnore.length - 1) !== ",") {
            cssImportIgnore += ",";
        }
        return fileContents.replace(cssImportRegExp, function (fullMatch, urlStart, importFileName, urlEnd, mediaTypes) {
            //Only process media type "all" or empty media type rules.
            if (mediaTypes && ((mediaTypes.replace(/^\s\s*/, '').replace(/\s\s*$/, '')) !== "all")) {
                return fullMatch;
            }

            importFileName = cleanCssUrlQuotes(importFileName);

            //Ignore the file import if it is part of an ignore list.
            if (cssImportIgnore && cssImportIgnore.indexOf(importFileName + ",") !== -1) {
                return fullMatch;
            }

            //Make sure we have a unix path for the rest of the operation.
            importFileName = importFileName.replace(/\\/g, "/");

            try {
                //if a relative path, then tack on the filePath.
                //If it is not a relative path, then the readFile below will fail,
                //and we will just skip that import.
                var fullImportFileName = importFileName.charAt(0) === "/" ? importFileName :filePath+ importFileName,
                    importContents = _fs.readFileSync(fullImportFileName,FILE_ENCODING), i,
                    importEndIndex, importPath, fixedUrlMatch, colonIndex, parts;
					
                //Make sure to flatten any nested imports.
                importContents = optimize.flattenCss(fullImportFileName, importContents);

                //Make the full import path
                importEndIndex = importFileName.lastIndexOf("/");

                //Make a file path based on the last slash.
                //If no slash, so must be just a file name. Use empty string then.
                importPath = (importEndIndex !== -1) ? importFileName.substring(0, importEndIndex + 1) : "";

                //Modify URL paths to match the path represented by this file.
                importContents = importContents&&importContents.replace(cssUrlRegExp, function (fullMatch, urlMatch) {
                    fixedUrlMatch = cleanCssUrlQuotes(urlMatch);
                    fixedUrlMatch = fixedUrlMatch.replace(/\\/g, "/");

                    //Only do the work for relative URLs. Skip things that start with / or have
                    //a protocol.
                    colonIndex = fixedUrlMatch.indexOf(":");
                    if (fixedUrlMatch.charAt(0) !== "/" && (colonIndex === -1 || colonIndex > fixedUrlMatch.indexOf("/"))) {
                        //It is a relative URL, tack on the path prefix
                        urlMatch = importPath + fixedUrlMatch;
                    } else {
                        console.log(importFileName + "\n  URL not a relative URL, skipping: " + urlMatch);
                    }

                    //Collapse .. and .
                    parts = urlMatch.split("/");
                    for (i = parts.length - 1; i > 0; i--) {
                        if (parts[i] === ".") {
                            parts.splice(i, 1);
                        } else if (parts[i] === "..") {
                            if (i !== 0 && parts[i - 1] !== "..") {
                                parts.splice(i - 1, 2);
                                i -= 1;
                            }
                        }
                    }

                    return "url(" + parts.join("/") + ")";
                });
                return importContents;
            } catch (e) {
                console.log(fileName + "\n  Cannot inline css import, skipping: " + importFileName);
				console.log(require("util").inspect(e));
                return fullMatch;
            }
        });
    },
    minifyCSS : function(fileList, distPath, config,ctx) {
		var result="";
        fileList=fileList||_util.getAllFileNamesByExt(".",".css");
        distPath=distPath||"all_css_minfied.css";
		if(ctx.flatCSS){
		    result = fileList.map(function(filePath) {
				var content=_fs.readFileSync(filePath, FILE_ENCODING);
				content=uglifyCSS.processString(optimize.flattenCss(filePath,content));
				return content;
			});
		}else{
			result = uglifyCSS.processFiles(fileList, config);
		}        
        _fs.writeFileSync(distPath, result, FILE_ENCODING);
        console.log(fileList + " is built to " + distPath);
    }, 
    minifyJS : function(fileList, distPath,outdir) {
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
        _fs.writeFileSync(outdir+"js_error.log", error, FILE_ENCODING);
        _fs.writeFileSync(distPath, result, FILE_ENCODING);
        console.log(' ' + distPath + ' built.');
    },
    cssLint : function(fileList,outdir) {
        outdir=outdir||"";
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
            _fs.writeFileSync(outdir+CSS_LINT_FILE, out, FILE_ENCODING);
        }
        console.log("please see css lint result at file " + outdir+CSS_LINT_FILE);
    },
    jsLint : function(fileList,outdir) {
        outdir=outdir||"";
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
            _fs.writeFileSync(outdir+JS_LINT_FILE, out, FILE_ENCODING);
        }  
        console.log("please see js lint result at file " + outdir+JS_LINT_FILE);
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
