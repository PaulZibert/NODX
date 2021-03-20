import json
from os import listdir,path
from os.path import join,getsize,isdir
from flask import Flask,request
PATH = path.dirname(__file__)
app = Flask(__name__,static_folder='dist',static_url_path='/')
@app.errorhandler(404)
def notFound(err):
    return app.send_static_file('index.html')
@app.after_request
def add_header(r):
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r
@app.route('/api/getDir')
def getDir():
    ret = {}
    path = join(PATH,'dist',request.args['path'])
    if not isdir(path):return "{}"
    for el in listdir(path):
        elPath = join(path,el)
        isFile = not isdir(elPath)
        ret[el] = {'isFile':isFile}
        if isFile:ret[el]['size'] = getsize(elPath)
    return json.dumps(ret)

if(__name__=="__main__"):
    app.run('::',2020,debug=True)