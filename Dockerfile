# Use an official Node.js runtime as the base image
FROM node:14-alpine

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the root directory in the Docker container
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Make the container's port 3000 available to the outside world
EXPOSE 3000

# Run the command to start your application
CMD [ "npm", "start" ]