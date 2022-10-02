from functools import wraps

from django.shortcuts import render

# Create your views here.
import dataclasses
import json
from dataclasses import dataclass, field
from typing import Tuple, List, Dict, Sequence

from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
import numpy as np

from . import models
from .models import ChairLamp, User, ToulousePieron


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
        for minimum_performance in list(performance_map.keys()):
            if performance >= minimum_performance:
                return performance_map[minimum_performance]


def check_can_start(test_model, *args, **kwargs):
    def http_request_wrapper(http_method, **kwargs):
        @wraps(http_method)
        def wrapper(cls, request: Request, *args, **kwargs):
            user_id = request.path.split('/')[-1]
            try:
                if not User.objects.filter(user_hash=user_id).exists():
                    return Response('No such User', status=400)
                test_record = test_model.objects.get(user_hash=user_id)
                if test_record.correct_indices is not None:
                    return Response('User Already Started The Test', status=400)
            except test_model.DoesNotExist as ex:
                pass #If the user is not in the test's table, then they can start the test
            return http_method(cls, request, *args, **kwargs)

        return wrapper

    return http_request_wrapper


def check_test_started(test_model, *args, **kwargs):
    def http_request_wrapper(http_method, **kwargs):
        @wraps(http_method)
        def wrapper(cls, request: Request, *args, **kwargs):
            user_id = request.path.split('/')[-1]
            try:
                test_record = test_model.objects.get(user_hash=user_id)
                if test_record.correct_indices is None:
                    return Response('User Did Not Start The Test', status=400)
            except test_model.DoesNotExist as ex:
                return Response('User Did Not Start The Test', status=400)
            return http_method(cls, request, *args, **kwargs)

        return wrapper

    return http_request_wrapper


class MatrixModel:

    def __init__(self, width: int, height: int, n_classes: int):
        self.width = width
        self.height = height
        self.n_classes = n_classes

    def create_random_matrix(self):
        return np.random.randint(0, self.n_classes, (self.width, self.height), dtype=int)

    def get_1d_indices_of_classes(self, classes: Sequence[int], matrix: np.ndarray):
        return [idx for idx, value in enumerate((matrix.flatten())) if value in classes]


class ChairLampEndpoint(APIView, MatrixModel):
    correct_picture_indices = [0, 3]

    def __init__(self, **kwargs):
        APIView.__init__(self)
        MatrixModel.__init__(self, width=3, height=4, n_classes=4)

    @check_can_start(test_model=ChairLamp)
    def get(self, request: Request, _format=None):

        user_id = request.path.split('/')[-1]

        random_matrix = self.create_random_matrix()
        correct_indices = self.get_1d_indices_of_classes(self.correct_picture_indices, random_matrix)

        ChairLamp(user_id, correct_indices).save()
        return Response(data={'matrix': random_matrix, "correct_indices": self.correct_picture_indices}, status=200)

    def _get_metrics(self, errors: List[int], revised: List[int]) -> ChairLampResult:

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
                n_revised_pictures = (min(minutely_data[minute_idx + 1]) + max(minutely_data[minute_idx])) // 2
                revised.append(n_revised_pictures)
            else:
                revised.append(len(circled_indices))
            errors.append(sum(1 for idx in circled_indices if idx not in correct_indices))

        return errors, revised

    @check_test_started(test_model=ChairLamp)
    def post(self, request: Request, format=None):
        """{"circled" : [[0,2], [0,2,4,9,10], [0,2,4,9,10,15]]} """

        body = json.loads(request.body)
        user_id = request.path.split('/')[-1]

        chair_lamp_record = ChairLamp.objects.get(user_hash=user_id)


        #take only revised indices into consideration
        circled_indices_per_minute = body['circled']
        correct_indices = json.loads(chair_lamp_record.correct_indices)
        max_revised_index = np.max(circled_indices_per_minute)
        correct_indices = [idx for idx in correct_indices if idx <= max_revised_index]


        errors, revised = self._evaluate_minutely_data(circled_indices_per_minute, correct_indices)

        results = self._get_metrics(errors, revised)

        chair_lamp_record.results = dataclasses.asdict(results)
        chair_lamp_record.correct_indices = None
        chair_lamp_record.save()
        return Response(status=204)


class ToulousePieronEndpoint(APIView, MatrixModel):
    correct_picture_indices = [1, 4, 5, 6]  # 0 = 0 degree rotation from 12 o'clock | 1 = 45degree | ..

    def __init__(self, **kwargs):
        APIView.__init__(self)
        MatrixModel.__init__(self, width=20, height=20, n_classes=360 // 45)

    @check_can_start(test_model=ToulousePieron)
    def get(self, request: Request, _format=None):
        user_id = request.path.split('/')[-1]

        if not User.objects.filter(user_hash=user_id).exists():
            return Response('No such User', status=400)

        random_matrix = self.create_random_matrix()
        correct_indices = self.get_1d_indices_of_classes(self.correct_picture_indices, random_matrix)

        ToulousePieron(user_id, correct_indices).save()
        return Response(data={'matrix': random_matrix}, status=200)

    @check_test_started(test_model=ToulousePieron)
    def post(self, request: Request, format=None):
        """{"circled" : [[0,2,4,9,10], [11,21,23], [40,43,51]]} """
        user_id = request.path.split('/')[-1]
        pieron_record = ToulousePieron.objects.get(user_hash=user_id)
        final_circled_indices = json.loads(request.body)['circled'][-1]

        if not (np.diff(np.array(final_circled_indices)) >= 0).all():
            pieron_record.correct_indices = None
            pieron_record.save()
            return Response(data="Incorrect completion of test", status=400)

        correct_indices = json.loads(pieron_record.correct_indices)

        # ignore first row and not revised
        last_revised_index = max(final_circled_indices)
        correct_indices = [idx for idx in correct_indices if idx <= last_revised_index]
        not_circled = sum([1 for idx in correct_indices if idx not in final_circled_indices and idx >= self.width])
        incorrectly_circled = sum([1 for idx in final_circled_indices if idx not in correct_indices and idx >= self.width])

        errors = not_circled + incorrectly_circled
        revised = (max(final_circled_indices) + 1) - self.width

        pieron_record.results = {"accuracy": (revised - errors) / revised * 100}
        pieron_record.save()

        return Response(status=204)
