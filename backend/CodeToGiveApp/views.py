from django.shortcuts import render

# Create your views here.
import dataclasses
import json
from dataclasses import dataclass, field
from typing import Tuple, List, Dict

from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
import numpy as np

from . import models
from .models import ChairLamp, User


@dataclass
class ChairLampResult:
    quality_of_attention_total: float
    quality_of_attention_minutes: List[float]
    extent_of_attention: float
    performance: float = field(init=False)
    category: str = field(init=False)
    fluctuating_attention: bool = field(init=False)
    desire_to_conform: bool = field(init=False)
    fatigue: bool = field(init=False)

    def __post_init__(self):

        performance_map = {
            97: "ok",
            95: "under average",
            0: "attention disorder"
        }

        very_good_performance = 100
        very_poor_performance = 90

        self.performance = 100 - self.quality_of_attention_total
        self.category = self._get_category(self.performance, performance_map)
        self.fluctuating_attention = self.extent_of_attention > 20
        self.desire_to_conform = self.get_minute_performance(-1) >= very_good_performance
        self.fatigue = self.get_minute_performance(-1) <= very_poor_performance

    def get_minute_performance(self, minute: int):
        return 100 - self.quality_of_attention_minutes[minute]

    def _get_category(self, performance: float, performance_map) -> str:
        assert performance >= 0
        for minimum_performance in list(performance_map.keys())[::-1]:
            if performance >= minimum_performance:
                return performance_map[minimum_performance]


class ChairLampEndpoint(APIView):
    width = 3
    height = 4
    n_pictures = 4
    correct_pictures = [0, 3]

    def get(self, request: Request, _format=None):
        """ {"n_pic": "3","w_h" : [6,3]} """

        user_id = request.path.split('/')[-1]

        if not User.objects.filter(user_hash=user_id).exists():
            return Response('No such User',status=400)

        random_matrix = np.random.randint(0, self.n_pictures, (self.height, self.width), dtype=int)

        correct_indices = [idx for idx, value in enumerate((random_matrix.flatten())) if
                           value in self.correct_pictures]
        ChairLamp(user_id, correct_indices).save()
        return Response(data={'matrix': random_matrix}, status=200)

    def _get_metrics(self, errors: List[int], revised: List[int]) -> ChairLampResult:
        assert len(revised) == len(errors)

        quality_of_attention_total = round(sum(errors) / sum(revised) * 100, 2)

        quality_of_attention_minutes = [round(errors[i] / revised[i] * 100, 2) for i in range(len(revised))]
        extent_of_attention = max(revised) - min(revised)

        result = ChairLampResult(quality_of_attention_total=quality_of_attention_total,
                                 quality_of_attention_minutes=quality_of_attention_minutes
                                 , extent_of_attention=extent_of_attention)

        return result

    def _evaluate_minutely_data(self, minutely_data: List[List[int]], correct_indices):

        revised = []
        errors = []

        for minute_idx, circled_indices in enumerate(minutely_data):

            if minute_idx < len(minutely_data) - 1:
                n_revised_pictures = (min(minutely_data[minute_idx + 1]) + max(minutely_data[minute_idx]))//2
                revised.append(n_revised_pictures)
            else:
                revised.append(len(circled_indices))
            errors.append(sum(1 for idx in circled_indices if idx not in correct_indices))

        return errors, revised

    def post(self, request: Request, format=None):
        """{"circled" : [[0,2,4,9,10], [11,21,23], [40,43,51]]} """

        body = json.loads(request.body)
        user_id = request.path.split('/')[-1]

        try:
            test_object = ChairLamp.objects.get(user_hash=user_id)
        except models.ChairLamp.DoesNotExist as ex:
            return Response('No such User',status=400)

        errors, revised = self._evaluate_minutely_data(body['circled'], json.loads(test_object.correct_indices))

        results = self._get_metrics(errors, revised)

        test_object.results = dataclasses.asdict(results)
        test_object.save()
        return Response('ok',status=200)
