FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

EXPOSE 8080

CMD [ "./scripts/start.sh" ]
