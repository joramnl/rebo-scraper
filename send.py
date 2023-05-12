import sys
import requests
from os import environ
from os.path import expanduser
from sys import stderr
import json

DEFAULT_API_SERVER = environ.get(
    'NOTIFY_API_SERVER', 'https://notify.run/api/')
CONFIG_FILENAME = '~/.config/notify-run'

class Notify:
    def __init__(self, api_server=None, endpoint=None):
        self.api_server = api_server or DEFAULT_API_SERVER
        self.endpoint = None
        self._config_file = expanduser(CONFIG_FILENAME)

        self.read_config()

        if endpoint is not None:
            self.endpoint = endpoint


    def read_config(self):
        self.config_file_exists = False
        try:
            with open(self._config_file, 'r') as conffile:
                self.config_file_exists = True
                config = json.load(conffile)
                self.endpoint = config['endpoint']
        except (IOError, OSError):
            return
        except ValueError:
            print('Invalid JSON in {}'.format(self._config_file))
            return
        
    def send(self, message, action=None, failsafe=True):
        if self.endpoint is None:
            if failsafe:
                print('Could not send notification because endpoint is not configured.', file=stderr)
                return
            else:
                raise NotConfigured()
        try:
            requests.post(self.endpoint, {'message': message, 'action': action}, verify=False)
        except Exception as e:
            if failsafe:
                print(f'Error sending notification: {e}', file=stderr)
            else:
                raise

class NotConfigured(Exception):
    pass


notify = Notify(endpoint="https://notify.run/MPm94Olx1LTXMcxB4cQQ")
notify.send(sys.argv[1], sys.argv[2])

