package com.example.backend.config;

import com.example.backend.services.DisabledStorageService;
import com.example.backend.services.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StorageConfig {
    @Bean
    @ConditionalOnProperty(
            name = "minio.enabled",
            havingValue = "false",
            matchIfMissing = true
    )
    public StorageService disabledStorageService() {
        return new StorageService(
                "http://localhost:9000",  // endpoint
                "minioadmin",             // accessKey
                "minioadmin",             // secretKey
                "elguindy",               // bucketName
                "http://localhost:9000",  // publicUrl
                false                     // enabled
        );
    }

    @Bean
    @ConditionalOnProperty(name = "minio.enabled", havingValue = "true")
    public StorageService minioStorageService(
            @Value("${minio.endpoint}") String endpoint,
            @Value("${minio.accessKey}") String accessKey,
            @Value("${minio.secretKey}") String secretKey,
            @Value("${minio.bucketName}") String bucketName,
            @Value("${minio.publicUrl}") String publicUrl
    ) {
        return new StorageService(
                endpoint,
                accessKey,
                secretKey,
                bucketName,
                publicUrl,
                true  // enabled
        );
    }
}