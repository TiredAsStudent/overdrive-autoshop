# 1. Use the official Node.js Linux image
FROM node:18-bullseye

# 2. Install PostgreSQL client tools (This installs pg_dump!)
RUN apt-get update && apt-get install -y postgresql-client

# 3. Create app directory
WORKDIR /usr/src/app

# 4. Install app dependencies
COPY package*.json ./
RUN npm install --production

# 5. Bundle app source
COPY . .

# 6. Expose the port your Express app uses
EXPOSE 5000

# 7. Start the server
CMD [ "node", "server.js" ]