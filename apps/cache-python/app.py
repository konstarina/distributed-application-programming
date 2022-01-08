import os
from flask import Flask, request, json
from flask_restful import Resource, Api, reqparse
from cachetools import TTLCache

PORT = os.environ['PORT'] if 'PORT' in os.environ else '4444'

app = Flask(__name__)
api = Api(app)

cache = TTLCache(maxsize=3, ttl=5)

app = Flask(__name__)

cache = TTLCache(maxsize=200, ttl=5)

@app.route('/get', methods=['GET'])
def getCacheValue():
  key = request.args.get('key')

  try:
    value = cache[key]
    return { "data": value, "expired": False }
  except KeyError:
    return { "data": None, "expired": True }


@app.route('/set', methods=['POST'])
def setCacheValue():
  content = request.json

  cache[content['key']] = content['value']
  return 'OK'

@app.route('/api/status', methods=['GET'])
def getStatus():
  return 'OK'

if __name__ == '__main__':
  app.run(port=PORT)  # run our Flask app