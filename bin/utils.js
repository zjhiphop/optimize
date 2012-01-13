
var fs=require("fs"),
    path=require("path"),
    _=require("underscore")
    _dir=false;
function iterator(url,list,extname){
   var stat=fs.statSync(url), 
      _check=extname?(path.extname(url)===extname):true;
   if(stat.isDirectory()){
     if(!/\.git$/g.test(url)&&_dir){ 
       list.push(url); 
     }  
     inner(url,list,extname);
   }else if(!_dir&&stat.isFile()&&_check&&!/\.min\./.test(url)){
     list.push(url);
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
  },
  getAllDirectory:function(dir){
     var dirList=[];
     _dir=true;
     iterator(dir,dirList);
     _dir=false;
     return dirList;
  }  
}
exports.util=util;
