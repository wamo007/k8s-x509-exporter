FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 9101
CMD ["node", "index.js"]