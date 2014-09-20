#dmn
[![Build Status](http://img.shields.io/travis/inikulin/dmn.svg?style=flat-square)](https://travis-ci.org/inikulin/dmn)

*Because I don't need your tests in my production!*

Packages in `npm` are bloated with stuff which you will never ever use, like build files and different kinds of test data. Guys from `npm` provided us with `.npmignore` files, but seems like almost no one uses it. Please, stop publishing your development stuff to `npm`. If I would like to run your tests and start hacking on your project I will do `git clone` not `npm install`. Once our project has increased in size in 13Mb and this is just because of single test data file which was used by one of our dependencies (true story). Poor testing farm...

So:
*  If you spread installed packages across multiple machines in your environment **then bloated dependencies make you unhappy**. 
*  If you get your local repo synced (e.g using Dropbox or Google Drive) **then bloated dependencies make you unhappy** (it takes so goddamn long to sync a big amount of smal useless files). 
*  If you distribute your project to end-user not via `npm` **then bloated dependencies make you unhappy**.
*  If you are a good person who cares about others **then bloated dependencies make you unhappy**. Just imagine how much useless stuff which will never be used by anyone is fetched, served and stored by `npm` and e.g. `TravisCI`. Imagine how thousands of small useless files impacts installation time of your package. 

-----------------------------------------------------------------
**dmn** (*"<b>d</b>ependency <b>m</b>i<b>n</b>ifier" or "<b>d</b>amn <b>m</b>issing .<b>n</b>pmignore" or "<b>d</b>mn is a <b>m</b>eaningless <b>n</b>ame"*) - is a command line tool which will help you deal with bloated dependencies. It can clean your `node_modules` from stuff which you will never need. And it can gracefully generate `.npmignore` file for your project. Both operations based on [list of ignore targets](https://github.com/inikulin/dmn/blob/master/lib/targets.js). If I missed something in it then just send me a pull request.

##Install
```
$ npm install -g dmn
```

##Usage
```
  Usage: dmn <command(s)> [options]
        
  Commands:
      gen         :  generate (or add items to existing) .npmignore file 
                     To keep item in release package just prepend it's
                     pattern with '!'.
      clean       :  clean project's node_modules from useless clutter

  Options:
      -f, -force  :  don't ask for command confirmation
      -l, -list   :  list files that will be deleted by "clean" command
```

##Examples
*Generate .npmignore for your project:*
```
$ cd <to_your_project>
$ dmn gen --f
```

*Or do this before publishing:*
```
$ dmn gen --f && npm publish
```

*Or even better:*
```
$ dmn gen --f && git add .npmignore && git commit ...
```

*Clean your project's dependencies:*
```
$ cd <to_your_project> 
$ dmn clean --f
```

*Clean newly installed dependency:*
```
$ npm install --save <new_dependency> && dmn clean --f
```

*Install dependencies then clean them for cloned repo:*
```
$ git clone https://github.com/<username>/<reponame>
$ cd <reponame> && npm install && dmn clean --f
```

##Questions or suggestions?
If you have any questions, please feel free to create an issue [here on github](https://github.com/inikulin/ineed/issues).


##Author
[Ivan Nikulin](https://github.com/inikulin) (ifaaan@gmail.com)

