package com.example.backend.config;

import com.example.backend.services.storage.MinioStorageProvider;
import com.example.backend.services.storage.S3StorageProviderWithPresignedUrls;
import com.example.backend.services.storage.StorageProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class StorageConfig {

    @Bean
    @ConditionalOnProperty(name = "storage.type", havingValue = "minio")
    public StorageProvider minioStorageProvider(
            @Value("${minio.endpoint}") String endpoint,
            @Value("${minio.accessKey}") String accessKey,
            @Value("${minio.secretKey}") String secretKey,
            @Value("${minio.bucketName}") String bucketName,
            @Value("${minio.publicUrl}") String publicUrl,
            @Value("${minio.enabled:true}") boolean enabled
    ) {
        log.info("🗄️ Initializing MinIO Storage Provider");
        log.info("   📍 Endpoint: {}", endpoint);
        log.info("   🪣 Bucket: {}", bucketName);

        return new MinioStorageProvider(endpoint, accessKey, secretKey, bucketName, publicUrl, enabled);
    }

    @Bean
    @ConditionalOnProperty(name = "storage.type", havingValue = "s3")
    public StorageProvider s3StorageProvider(
            @Value("${aws.s3.access-key}") String accessKey,
            @Value("${aws.s3.secret-key}") String secretKey,
            @Value("${aws.s3.bucket-name}") String bucketName,
            @Value("${aws.s3.region}") String region,
            @Value("${aws.s3.enabled:true}") boolean enabled
    ) {
        log.info("☁️ Initializing AWS S3 Storage with Pre-Signed URLs");
        log.info("   🪣 Bucket: {}", bucketName);
        log.info("   🌍 Region: {}", region);

        return new S3StorageProviderWithPresignedUrls(accessKey, secretKey, bucketName, region, enabled);
    }

    @Bean
    @ConditionalOnProperty(name = "storage.type", havingValue = "disabled", matchIfMissing = true)
    public StorageProvider disabledStorageProvider() {
        log.warn("⚠️ Storage is DISABLED");

        return new MinioStorageProvider(
                "http://localhost:9000",
                "minioadmin",
                "minioadmin",
                "elguindy",
                "http://localhost:9000",
                false
        );
    }
}