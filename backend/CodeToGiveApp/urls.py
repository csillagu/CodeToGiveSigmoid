from django.urls import re_path as url

from .views import ChairLampEndpoint

urlpatterns =[
    url(r'^chairlamp/(\w|d){32}$', ChairLampEndpoint.as_view()),
]