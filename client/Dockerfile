
# base image
FROM node:20-alpine AS builder

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH ./node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json ./

RUN npm install
RUN npm install @vue/cli

COPY ./ ./

# start app
CMD ["npm", "run", "production-build"]

FROM nginx
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
