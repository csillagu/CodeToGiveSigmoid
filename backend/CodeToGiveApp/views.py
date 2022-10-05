import base64
from functools import wraps

from django.shortcuts import render
from django import forms
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
from .models import ChairLamp, User, ToulousePieron, Bourdon
from .pdf_email_service import PDFEmailSerive


@dataclass
class IncrementalMetrics:
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
                pass  # If the user is not in the test's table, then they can start the test
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



class IncrementalMatrixTest:

    def __init__(self, width: int, height: int, n_classes: int):
        self.width = width
        self.height = height
        self.n_classes = n_classes

    def create_random_matrix(self):
        np.random.seed(seed=106)
        return np.random.randint(0, self.n_classes, (self.width, self.height), dtype=int)

    def preprocess_and_validate(self, incrementally_marked_indices, correct_indices):

        for minute_data in incrementally_marked_indices:
            if not (np.diff(np.array(minute_data)) >= 0).all():
                raise ValueError('Data not Incremental')
        correct_indices = self.cap_correct_indices(incrementally_marked_indices, correct_indices)

        return incrementally_marked_indices, correct_indices

    def _get_incremental_metrics(self, errors: List[int], revised: List[int]) -> IncrementalMetrics:
        quality_of_attention_total = round(sum(errors) / sum(revised) * 100, 2)

        quality_of_attention_minutes = [round(errors[i] / revised[i] * 100, 2) if revised[i] != 0 else 0 for i in range(len(revised))]
        extent_of_attention = max(revised) - min(revised)

        result = IncrementalMetrics(quality_of_attention_total=quality_of_attention_total,
                                    quality_of_attention_minutes=quality_of_attention_minutes
                                    , extent_of_attention=extent_of_attention)

        return result

    def get_1d_indices_of_classes(self, classes: Sequence[int], matrix: np.ndarray):
        return [idx for idx, value in enumerate((matrix.flatten())) if value in classes]

    def cap_correct_indices(self, marked_indices, correct_indices):
        last_marked_index = max(marked_indices[-1])

        capped = [idx for idx in correct_indices if idx <= last_marked_index]
        return capped

    def _evaluate_incremental_filling(self, incrementally_marked_indices: List[List[int]]
                                      , correct_indices: List[int]
                                      , ignored_indices: List[int] = []):
        revised = []
        errors = []
        for minute_idx, circled_indices in enumerate(incrementally_marked_indices):
            prev_min = [] if minute_idx == 0 else incrementally_marked_indices[minute_idx - 1]
            diff_from_previous_min = [idx for idx in circled_indices if idx not in prev_min]

            error = [idx for idx in circled_indices if idx not in correct_indices + ignored_indices] + \
                    [idx for idx in correct_indices if idx not in circled_indices + ignored_indices]
            if len(diff_from_previous_min) != 0:
                revised.append((max(diff_from_previous_min) if diff_from_previous_min != [] else 0) - (max(prev_min) if prev_min != [] else 0))
            else:
                revised.append(0)
            errors.append(len(error))

        return errors, revised


class ChairLampEndpoint(APIView, IncrementalMatrixTest):
    correct_picture_indices = [0, 3]

    def __init__(self, **kwargs):
        APIView.__init__(self)
        IncrementalMatrixTest.__init__(self, width=19, height=21, n_classes=18)

    #@check_can_start(test_model=ChairLamp)
    def get(self, request: Request, _format=None):
        user_id = request.path.split('/')[-1]

        random_matrix = self.create_random_matrix()
        correct_indices = self.get_1d_indices_of_classes(self.correct_picture_indices, random_matrix)

        ChairLamp(user_id, correct_indices).save()
        return Response(data={'matrix': random_matrix, "correct_indices": self.correct_picture_indices}, status=200)

    #@check_test_started(test_model=ChairLamp)
    def post(self, request: Request, format=None):
        """{"circled" : [[0,2], [0,2,4,9,10], [0,2,4,9,10,15]],"finished_at":"date_string" ,"image" : bytes}"""
        body = json.loads(request.body)
        PDFEmailSerive().send_pdf(None, body['image'])
        user_id = request.path.split('/')[-1]
        chair_lamp_record = ChairLamp.objects.get(user_hash=user_id)
        marked_indices_per_minute = body['circled']
        correct_indices = json.loads(chair_lamp_record.correct_indices)

        try:
            marked_indices, correct_indices = self.preprocess_and_validate(marked_indices_per_minute, correct_indices)
        except ValueError:
            chair_lamp_record.correct_indices = None
            chair_lamp_record.save()
            return Response(data="Incorrect completion of test", status=400)

        errors, revised = self._evaluate_incremental_filling(marked_indices_per_minute, correct_indices)

        metrics = self._get_incremental_metrics(errors, revised)

        metrics = dataclasses.asdict(metrics)
        metrics['finished'] = body['finished']
        chair_lamp_record.results = metrics
        chair_lamp_record.correct_indices = None
        chair_lamp_record.save()


        return Response(status=204)


class ToulousePieronEndpoint(APIView, IncrementalMatrixTest):
    correct_picture_indices = [1, 4, 5, 6]  # 0 = 0 degree rotation from 12 o'clock | 1 = 45degree | ..

    def __init__(self, **kwargs):
        APIView.__init__(self)
        IncrementalMatrixTest.__init__(self, width=20, height=20, n_classes=360 // 45)

    #@check_can_start(test_model=ToulousePieron)
    def get(self, request: Request, _format=None):
        user_id = request.path.split('/')[-1]

        random_matrix = self.create_random_matrix()
        correct_indices = self.get_1d_indices_of_classes(self.correct_picture_indices, random_matrix)

        ToulousePieron(user_id, correct_indices).save()
        return Response(data={'matrix': random_matrix}, status=200)

    #@check_test_started(test_model=ToulousePieron)
    def post(self, request: Request, format=None):
        """{"circled" : [[0,2], [0,2,4,9,10], [0,2,4,9,10,15]],"finished_at":"date_string" ,"image" : bytes}"""

        user_id = request.path.split('/')[-1]
        body = json.loads(request.body)
        pieron_record = ToulousePieron.objects.get(user_hash=user_id)
        marked_indices = body['circled'][-1]  # only check finally marked indices
        correct_indices = json.loads(pieron_record.correct_indices)

        try:
            marked_indices, correct_indices = self.preprocess_and_validate([marked_indices], correct_indices)
        except ValueError:
            pieron_record.correct_indices = None
            pieron_record.save()
            return Response(data="Incorrect completion of test", status=400)

        errors, revised = self._evaluate_incremental_filling(marked_indices, correct_indices,
                                                             ignored_indices=[
                                                                 list(range(self.width))])  # ignore first row

        errors = sum(errors)
        revised = sum(revised)

        pieron_record.results = {"accuracy": (revised - errors) / revised * 100, "finished" : body['finished']}
        pieron_record.correct_indices = None
        pieron_record.save()

        return Response(status=204)


class BourdonEndpoint(APIView, IncrementalMatrixTest):

    def __init__(self, **kwargs):
        APIView.__init__(self)
        IncrementalMatrixTest.__init__(self, width=40, height=40, n_classes=26)

    #@check_can_start(test_model=Bourdon)
    def get(self, request: Request, _format=None):
        user_id = request.path.split('/')[-1]

        random_matrix = self.create_random_matrix()

        flat_random_matrix = random_matrix.flatten()
        correct_indices = []

        for row_start_idx in range(0, self.width * self.height, self.width):
            row = flat_random_matrix[row_start_idx:row_start_idx + self.width]
            row_correct_indices = np.argwhere(row == flat_random_matrix[row_start_idx]).flatten() + row_start_idx
            correct_indices += row_correct_indices.tolist()

        Bourdon(user_id, correct_indices).save()
        return Response(data={'matrix': random_matrix}, status=200)

    #@check_test_started(test_model=Bourdon)
    def post(self, request: Request, format=None):
        """{"circled" : [[0,2], [0,2,4,9,10], [0,2,4,9,10,15]],"finished_at":"date_string" ,"image" : bytes}"""

        user_id = request.path.split('/')[-1]
        body = json.loads(request.body)
        burdon_record = Bourdon.objects.get(user_hash=user_id)
        marked_indices_per_minute = body['circled']
        correct_indices = json.loads(burdon_record.correct_indices)

        try:
            marked_indices, correct_indices = self.preprocess_and_validate(marked_indices_per_minute, correct_indices)

        except ValueError:
            burdon_record.correct_indices = None
            burdon_record.save()
            return Response(data="Incorrect completion of test", status=400)

        # ignore first column (those are the labels)
        ignored_indices = list(range(0, self.width * self.height, self.width))
        errors, revised = self._evaluate_incremental_filling(marked_indices_per_minute, correct_indices,
                                                             ignored_indices)

        metrics = self._get_incremental_metrics(errors, revised)
        metrics = dataclasses.asdict(metrics)
        metrics['finished'] = body['finished']
        burdon_record.results = metrics
        burdon_record.correct_indices = None
        burdon_record.save()
        return Response(status=204)
