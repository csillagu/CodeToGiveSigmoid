import json

from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
import numpy as np
class ChairLamp(APIView):

    def get(self, request : Request, format=None):
        body = json.loads(request.body)
        width,height = body['w_h']
        random_matrix = np.random.randint(0, body['n_pic'], (height, width),dtype=int)
        return Response(data = {'matrix':random_matrix},status=202)

