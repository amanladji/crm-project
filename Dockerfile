# Stage 1: Build the React frontend
FROM node:20 AS frontend-build
WORKDIR /app/frontend
# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install
# Copy frontend source code and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Spring Boot backend
FROM maven:3.9.6-eclipse-temurin-17 AS backend-build
WORKDIR /app/backend
# Copy the backend pom.xml and source code
COPY backend/pom.xml ./
COPY backend/src ./src
# Copy the built frontend static files to the Spring Boot static resources directory
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static
# Build the Spring Boot app (skip tests to speed up deployment)
RUN mvn clean package -DskipTests

# Stage 3: Run the application
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=backend-build /app/backend/target/*.jar app.jar

# Render assigns an dynamic PORT, Spring Boot defaults to 8080. We use the server.port env variable
ENV SERVER_PORT=${PORT:-8080}
EXPOSE ${PORT:-8080}

ENTRYPOINT ["java", "-jar", "app.jar"]
