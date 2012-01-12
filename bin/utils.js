
var fs=require("fs"),
    path=require("path"),
    _=require("underscore");
function iterator(url,fileList,extname){
   var stat=fs.statSync(url),
      _check=extname?(path.extname(url)===extname):true;
   if(stat.isDirectory()){
     inner(url,fileList,extname);
   }else if(stat.isFile()&&_check&&!/\.min\./.test(url)){
     fileList.push(url);
   }
}
function inner(url,fileList,ext){
  var arr = fs.readdirSync(url);
  for(var i = 0, el ; el = arr[i++];){
      if(/^\./.test(el)) continue;
      iterator(url+"/"+el,fileList,ext);
  }
}
    
util={
  getAllFileNamesByExt:function(dir,ext){
     var fileList=[];
     dir=dir||".";
     ext=ext||".js";
     iterator(dir,fileList,ext);
     return fileList;
  },
  getAllFileNames:function(dir){
     var fileList=[];
     iterator(dir,fileList);
     return fileList;
  }
}
exports.util=util;
