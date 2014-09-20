dmn
===
[![Build Status](http://img.shields.io/travis/inikulin/dmn.svg?style=flat-square)](https://travis-ci.org/inikulin/dmn)

*Because I don't need your tests in my production!*

Packages in `npm` are bloated with stuff which you will never ever use, like build files and different kinds of test data. Guys from `npm` provided us with `.npmignore` files, but seems like almost no one uses it. Please, stop publishing your development stuff to `npm`. If I would like to run your tests and start hacking on your project I will do `git clone` not `npm install`. Once our project has increased in size in 13Mb and this is just because of single test data file which was used by one of our dependencies (true story). Poor testing farm...

So:
*  If you spread installed packages across multiple machines in your environment **then bloated dependencies make you unhappy**. 
*  If you get your local repo synced (e.g using Dropbox or Google Drive) **then bloated dependencies make you unhappy** (it takes so goddamn long to sync a big amount of smal useless files). 
*  If you distribute your project to end-user not via `npm` **then bloated dependencies make you unhappy**.
*  If you are a good person who cares about others **then bloated dependencies make you unhappy**. Just imagine how much useless stuff which will never be used by anyone is fetched, served and stored by `npm` and e.g. `TravisCI`. Imagine how thousands of small useless files impacts installation time of your package. 

**dmn** (*"<b>d</b>ependency <b>m</b>i<b>n</b>ifier" or "<b>d</b>amn <b>m</b>issing .<b>n</b>pmignore" or "<b>d</b>mn is a <b>m</b>eaningless <b>n</b>ame"*) - is a command line tool which will help you deal with bloated dependencies. It can clean your `node_modules` from stuff which you will never need. And it can generate `.npmignore` file for your project.
