import argparse
import base64
import io
import json
import os
import subprocess
from copy import copy
from io import BytesIO
from docx2pdf import convert
import docx

from .models import ChairLamp, User

from PIL import Image


class PDFEmailService:

    def send_email(self, pdf_name: str, id: str, name: str):

        # SEND EMAIL
        import smtplib
        from os.path import basename
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from email.mime.application import MIMEApplication

        # secret login. Should be stored somewhere else. Only for POC and sketch solution.
        gmail_user = 'sigmoidsender17@gmail.com'
        gmail_password = 'hqafypjhsinfbtao'
        to = 'marcell.sch.hu@gmail.com'

        msg = MIMEMultipart()
        msg['From'] = gmail_user
        msg['To'] = to
        msg['Subject'] = f"Kitöltött teszt-{id}"
        content = f"""{name} kitöltötte a Toulouse tesztet! \nAz eredményeket csatoltuk."""
        body = MIMEText(content, 'plain')
        msg.attach(body)

        filename = pdf_name

        with open(filename, 'rb') as f:
            part = MIMEApplication(f.read(), Name=basename(filename))
            part['Content-Disposition'] = 'attachment; filename="{}"'.format(basename(filename))
        msg.attach(part)

        try:
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
            server.ehlo()
            server.login(gmail_user, gmail_password)
            server.send_message(msg)
            server.close()
            print('Email sent!')
        except:
            print('Something went wrong during email sending...')

    def generate_latex(self, content):
        with open('CodeToGiveApp/data/template.tex', 'w') as f:
            f.write(content)
        subprocess.call('pdflatex CodeToGiveApp/data/template.tex')


        # parser = argparse.ArgumentParser()
        # parser.add_argument('-c', '--course')
        # parser.add_argument('-t', '--title')
        # parser.add_argument('-n', '--name', )
        # parser.add_argument('-s', '--school', default='My U')

        # args = parser.parse_args()

        # cmd = ['pdflatex', '-interaction', 'nonstopmode', 'cover.tex']
        # proc = subprocess.Popen(cmd)
        # proc.communicate()

        # retcode = proc.returncode
        # if not retcode == 0:
        #     os.unlink('cover.pdf')
        #     raise ValueError('Error {} executing command: {}'.format(retcode, ' '.join(cmd)))
        #
        # os.unlink('cover.tex')
        # os.unlink('cover.log')

    def send_chairlamp_results(self, chairlamp_record: ChairLamp, image_bytes: str):

        image = image_bytes.split(',')[1]

        data = base64.b64decode(image)
        im = Image.open(BytesIO(data), formats=['jpeg'])

        im.save('CodeToGiveApp/data/kitoltott.png')

        latex_template_name = 'CodeToGiveApp/data/chairlamp.tex'

        with open(latex_template_name) as f:
            content = f.read()

        for metric in (
                'quality_of_attention_total', 'quality_of_attention_minutes', 'extent_of_attention', 'performance',
                'category',
                'fluctuating_attention', 'desire_to_conform', 'fatigue'):
            name = metric.replace(' ', '_')
            name = name + '0'
            content = content.replace(name, str(chairlamp_record.results[metric]))

        errors = chairlamp_record.results['errors_minutes']
        revised = chairlamp_record.results['revised_minutes']
        sum_err = sum(errors)
        sum_rev = sum(errors)
        while (len(errors) <= 5):
            errors.append('-')
            revised.append('-')

        for idx, value in enumerate(errors):
            content = content.replace(f'errors_minutes@{idx}', str(value))

        for idx, value in enumerate(revised):
            content = content.replace(f'revised_minutes@{idx}', str(value))

        content = content.replace('errors_minutes@total',str(sum_err))
        content = content.replace('revised_minutes@total',str(sum_rev))

        self.generate_latex(content)
