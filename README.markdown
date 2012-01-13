#A tool used to relax your css&js merge&minify.  
###use:
    npm install -g optimize
###to install it in your computer.  

## It has the fllowing features:
1.  merge all css and js files from base dir   
2.  use jshint to detect errors and potential problems with the js code  
3.  use jshint to detect errors and potential problems with the js code    
4.  use csshint to help point out problems with the CSS code   
5.  build with a config json file.  

    eg:
    {    
      "dir":".",    
      "out":"build/",    
      "files":{  
         "js":[],  
         "css":[]  
      },  
      "lint":{  
         "js":true,  
         "css":true  
      },  
      "minify":{  
         "css":true,  
         "js":true  
      },  
      "concat":{   
         "css":true,  
         "js":true  
      },  
      "watch":{  
         "minify":true,  
         "lint":false  
      }  
    }  

##example:
    optimize watch //this will watch all project,and build while files changed
    
##  TODO:  
1.  auto merge @import css files.   
2.  auto task  deploy   
    