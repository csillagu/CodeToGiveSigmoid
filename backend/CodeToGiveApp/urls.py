from django.urls import re_path as url

from .views import ChairLampEndpoint, ToulousePieronEndpoint

urlpatterns =[
    url(r'^chairlamp/(\w|d){32}$', ChairLampEndpoint.as_view()),
    url(r'^toulousepieron/(\w|d){32}$', ToulousePieronEndpoint.as_view()),
]