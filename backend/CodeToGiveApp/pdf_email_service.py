import argparse
import base64
import io
import json
import os
import subprocess
import threading
import time
from copy import copy
from io import BytesIO
from typing import Union

from .models import ChairLamp, User, ToulousePieron, Bourdon

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

    def generate_latex(self, content, uid, uname):
        with open('CodeToGiveApp/data/temp/template.tex', 'w') as f:
            f.write(content)
        print(os.getcwd())
        pdfname='CodeToGiveApp/data/out/'+str(time.time())
        subprocess.call('pdflatex CodeToGiveApp/data/temp/template.tex -interaction nonstopmode -jobname='+pdfname)
        self.send_email( pdfname+'.pdf', uid, uname)

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

    def send_detailed_results(self, db_record: Union[ChairLamp, ToulousePieron, Bourdon], image_bytes: str):

        template_map = {
            ChairLamp : 'CodeToGiveApp/latex/chairlamp2.tex',
            ToulousePieron : 'CodeToGiveApp/latex/toulouse.tex',
            Bourdon : 'CodeToGiveApp/latex/bourdon.tex',
        }

        try:
            image = image_bytes.split(',')[1]

            data = base64.b64decode(image)
            im = Image.open(BytesIO(data), formats=['jpeg'])

            im.save('CodeToGiveApp/data/temp/kitoltott.png')

            latex_template_name = template_map[type(db_record)]

            with open(latex_template_name) as f:
                content = f.read()

            content = content.replace('@res',str(db_record.results.get('accuracy')))

            for metric in (
                    'quality_of_attention_total', 'quality_of_attention_minutes', 'extent_of_attention', 'performance',
                    'category',
                    'fluctuating_attention', 'desire_to_conform', 'fatigue'):
                name = metric.replace(' ', '_')
                name = name + '0'
                content = content.replace(name, str(db_record.results.get(metric, '-')))

            errors = db_record.results.get('errors_minutes', '-')
            revised = db_record.results.get('revised_minutes', '-')
            sum_err = sum(errors)
            sum_rev = sum(revised)
            while (len(errors) <= 5):
                errors.append('-')
                revised.append('-')

            for idx, value in enumerate(errors):
                content = content.replace(f'errors_minutes@{idx+1}', str(value))

            for idx, value in enumerate(revised):
                content = content.replace(f'revised_minutes@{idx+1}', str(value))

            content = content.replace('errors_minutes@total',str(sum_err))
            content = content.replace('revised_minutes@total',str(sum_rev))

            coords = ""
            if 'quality_of_attention_minutes' in db_record.results:
                for idx, att in enumerate(db_record.results['quality_of_attention_minutes']):
                    coords = coords + f'({idx + 1}, {att}) '
                content = content.replace('coords', coords)

        except (KeyError , TypeError):
            print('some attributes were not found during parsing')

        username=User.objects.get(user_hash=db_record.user_hash).user_name
        content=content.replace("@Name", username)
        content=content.replace("@Email", "example-mail@ex.com")
        x = threading.Thread(target=self.generate_latex, args=(content, db_record.user_hash, username)).start()
        return

