import base64
import io
from io import BytesIO

from PIL import Image


class PDFEmailSerive:


    def send_pdf(self,metrics, image):

        image = image.split(',')[1]

        data = base64.b64decode(image)
        im = Image.open(BytesIO(data),formats=['jpeg'])

        im.save('tmp.png')