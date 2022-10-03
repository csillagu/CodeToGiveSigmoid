import json
from django.db import models



class User(models.Model):
    user_hash = models.CharField(primary_key=True, max_length=32)
    user_name = models.CharField(max_length=100)


class ChairLamp(models.Model):
    user_hash = models.CharField(primary_key=True, max_length=32)
    correct_indices = models.CharField(max_length=1000, null=True, blank=True, default=None)
    results = models.CharField(max_length=750, null=True, blank=True, default=None)


class ToulousePieron(models.Model):
    user_hash = models.CharField(primary_key=True, max_length=32)
    correct_indices = models.CharField(max_length=1000, null=True, blank=True, default=None)
    results = models.CharField(max_length=750, null=True, blank=True, default=None)


class Bourdon(models.Model):
    user_hash = models.CharField(primary_key=True, max_length=32)
    correct_indices = models.CharField(max_length=1000, null=True, blank=True, default=None)
    results = models.CharField(max_length=750, null=True, blank=True, default=None)