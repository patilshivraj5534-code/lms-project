FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src

# Write application.properties directly during build
RUN mkdir -p src/main/resources && cat > src/main/resources/application.properties << 'EOF'
spring.application.name=backend
spring.datasource.url=jdbc:mysql://mysql-3591a94d-shubhamsavant066-de45.i.aivencloud.com:14256/defaultdb?sslMode=REQUIRED
spring.datasource.username=avnadmin
spring.datasource.password=AVNS_xZtACPGzjff6wRyZzNi
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.sql.init.mode=never
jwt.secret=lms-access-secret-key-change-in-production-32chars
jwt.refresh-secret=lms-refresh-secret-key-change-in-production-32chars
logging.level.com.lms=INFO
logging.level.org.springframework.web=WARN
EOF

RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
