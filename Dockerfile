FROM nikolaik/python-nodejs:python3.11-nodejs20

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY *.crt /usr/share/ca-certificates

# Certificates fix
RUN apt-get install -y --no-install-recommends ca-certificates
RUN update-ca-certificates
RUN pip install pyOpenSSL --upgrade
RUN pip install --upgrade certifi --force
RUN apt install --reinstall openssl
RUN apt install ca-certificates
RUN update-ca-certificates --fresh
RUN export SSL_CERT_DIR=/etc/ssl/certs

# Directories
RUN mkdir hashes

# node packages
RUN npm set strict-ssl=false  
RUN npm install

# python packages
RUN pip install notify-run

# Bundle app source
COPY . .

CMD [ "node", "index.js" ]
#CMD ["python", "send.py", "test", "test"]